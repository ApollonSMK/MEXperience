'use server';

import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { revalidatePath } from 'next/cache';
import { startOfWeek, startOfMonth } from 'date-fns';

export async function generateInvitation() {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // 1. Buscar Perfil e Plano
    const { data: profile } = await supabase
        .from('profiles')
        .select('plan_id, minutes_balance')
        .eq('id', user.id)
        .single();
    
    if (!profile?.plan_id) {
        return { success: false, error: 'Apenas membros subscritos podem gerar convites.' };
    }

    if ((profile?.minutes_balance || 0) <= 0) {
         return { success: false, error: 'Saldo de minutos insuficiente para convidar.' };
    }

    const { data: plan } = await supabase
        .from('plans')
        .select('title, benefits')
        .eq('id', profile.plan_id)
        .single();

    if (!plan) return { success: false, error: 'Plano não encontrado.' };

    // 2. Verificar Limites do Plano
    // Exemplo de estrutura benefits: { guestPasses: { quantity: 2, period: 'month' } }
    const benefits = plan.benefits as any;
    const guestLimit = benefits?.guestPasses?.quantity || 0;
    const guestPeriod = benefits?.guestPasses?.period || 'month'; // 'week' ou 'month'

    if (guestLimit === 0) {
        return { success: false, error: `O plano ${plan.title} não permite convidados.` };
    }

    // Calcular data de início do ciclo
    const now = new Date();
    let periodStartDate: Date;

    if (guestPeriod === 'week') {
        // Semana começa na Segunda-feira (1)
        periodStartDate = startOfWeek(now, { weekStartsOn: 1 });
    } else {
        periodStartDate = startOfMonth(now);
    }

    // Contar convites gerados neste período (Exclui cancelados)
    const { count, error: countError } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('host_user_id', user.id)
        .neq('status', 'cancelled') // Convites cancelados não consomem a quota
        .gte('created_at', periodStartDate.toISOString());

    if (countError) return { success: false, error: 'Erro ao verificar limites.' };

    const currentUsage = count || 0;

    if (currentUsage >= guestLimit) {
        return { 
            success: false, 
            error: `Limite atingido! O seu plano permite ${guestLimit} convites por ${guestPeriod === 'week' ? 'semana' : 'mês'}.` 
        };
    }

    // 3. Criar convite
    const { data, error } = await supabase.from('invitations').insert({
        host_user_id: user.id,
        status: 'active'
    }).select().single();

    if (error) return { success: false, error: error.message };
    
    revalidatePath('/profile/invite');
    return { success: true, data };
}

export async function cancelInvitation(invitationId: string) {
    const supabase = await createSupabaseRouteClient();
    const { error } = await supabase.from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

    if (error) return { success: false, error: error.message };
    revalidatePath('/profile/invite');
    return { success: true };
}

// Ação Admin: Validar e Resgatar o Convite
export async function redeemInvitation(invitationId: string, serviceId: string, duration: number) {
    const supabase = await createSupabaseRouteClient();
    
    // 1. Verificar Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    const { data: adminProfile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!adminProfile?.is_admin) throw new Error('Apenas admins podem validar convites.');

    // 2. Buscar o convite e o host
    const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .select('*, profiles:host_user_id (id, display_name, email, minutes_balance)')
        .eq('id', invitationId)
        .single();

    if (inviteError || !invitation) return { success: false, error: 'Convite inválido ou não encontrado.' };
    if (invitation.status !== 'active') return { success: false, error: `Este convite já está ${invitation.status}.` };

    const host = invitation.profiles as any; // Type assertion

    // 3. Verificar saldo do host
    if (host.minutes_balance < duration) {
        return { success: false, error: `Saldo insuficiente. O anfitrião tem apenas ${host.minutes_balance} min.` };
    }

    // 4. Buscar nome do serviço
    const { data: service } = await supabase.from('services').select('name').eq('id', serviceId).single();
    const serviceName = service?.name || 'Serviço Convidado';

    // 5. TRANSACTION (Manual): Atualizar Convite, Deduzir Saldo, Criar Agendamento
    // Nota: Em Supabase puro faríamos uma RPC function para garantir atomicidade, mas aqui faremos sequencial com checks.
    
    // A. Marcar como usado
    const { error: updateError } = await supabase.from('invitations').update({ 
        status: 'used', 
        used_at: new Date().toISOString() 
    }).eq('id', invitationId);

    if (updateError) return { success: false, error: 'Erro ao atualizar convite.' };

    // B. Deduzir saldo
    const { error: balanceError } = await supabase.from('profiles').update({
        minutes_balance: host.minutes_balance - duration
    }).eq('id', host.id);

    if (balanceError) {
        // Rollback manual (reabrir convite)
        await supabase.from('invitations').update({ status: 'active', used_at: null }).eq('id', invitationId);
        return { success: false, error: 'Erro ao deduzir saldo.' };
    }

    // C. Criar Agendamento (Registro)
    // Criamos um agendamento "Concluído" imediatamente para registro histórico
    const { error: apptError } = await supabase.from('appointments').insert({
        user_id: host.id,
        user_name: `${host.display_name} (Convidado)`,
        user_email: host.email,
        service_name: `GUEST: ${serviceName}`,
        date: new Date().toISOString(),
        duration: duration,
        status: 'Concluído',
        payment_method: 'minutes'
    });

    if (apptError) {
        // Apenas logamos erro, pois o saldo já foi cobrado e convite usado. O registro financeiro é o mais importante.
        console.error('Erro ao criar log de agendamento para convite:', apptError);
    }

    revalidatePath('/admin/scan');
    return { success: true };
}