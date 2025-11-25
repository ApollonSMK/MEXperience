'use server';

import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { revalidatePath } from 'next/cache';
import { startOfWeek, startOfMonth } from 'date-fns';

export async function generateInvitation(serviceId: string, duration: number) {
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

    const currentBalance = profile.minutes_balance || 0;

    if (currentBalance < duration) {
         return { success: false, error: `Saldo insuficiente. Você tem ${currentBalance} min, mas o serviço requer ${duration} min.` };
    }

    const { data: plan } = await supabase
        .from('plans')
        .select('title, benefits')
        .eq('id', profile.plan_id)
        .single();

    if (!plan) return { success: false, error: 'Plano não encontrado.' };

    // 2. Verificar Limites do Plano
    const benefits = plan.benefits as any;
    const guestLimit = benefits?.guestPasses?.quantity || 0;
    const guestPeriod = benefits?.guestPasses?.period || 'month';

    if (guestLimit === 0) {
        return { success: false, error: `O plano ${plan.title} não permite convidados.` };
    }

    const now = new Date();
    let periodStartDate: Date;

    if (guestPeriod === 'week') {
        periodStartDate = startOfWeek(now, { weekStartsOn: 1 });
    } else {
        periodStartDate = startOfMonth(now);
    }

    const { count, error: countError } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('host_user_id', user.id)
        .neq('status', 'cancelled')
        .gte('created_at', periodStartDate.toISOString());

    if (countError) return { success: false, error: 'Erro ao verificar limites.' };

    const currentUsage = count || 0;

    if (currentUsage >= guestLimit) {
        return { 
            success: false, 
            error: `Limite de convites atingido (${guestLimit} por ${guestPeriod === 'week' ? 'semana' : 'mês'}).` 
        };
    }

    // 3. Buscar detalhes do serviço para snapshot
    const { data: service } = await supabase
        .from('services')
        .select('name')
        .eq('id', serviceId)
        .single();
    
    if (!service) return { success: false, error: 'Serviço inválido.' };

    // 4. Criar convite com detalhes
    const { data, error } = await supabase.from('invitations').insert({
        host_user_id: user.id,
        status: 'active',
        service_id: serviceId,
        duration: duration,
        service_snapshot: { name: service.name }
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
export async function redeemInvitation(invitationId: string, serviceId?: string, duration?: number) {
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

    const host = invitation.profiles as any; 

    // DETERMINAR SERVIÇO E DURAÇÃO FINAL
    // Prioridade: O que foi passado na função (override do admin) > O que está no convite
    const finalServiceId = serviceId || invitation.service_id;
    const finalDuration = duration || invitation.duration;

    if (!finalDuration) {
        return { success: false, error: 'Duração não definida no convite nem pelo admin.' };
    }

    // 3. Verificar saldo do host
    if (host.minutes_balance < finalDuration) {
        return { success: false, error: `Saldo insuficiente. O anfitrião tem apenas ${host.minutes_balance} min.` };
    }

    // 4. Buscar nome do serviço para histórico
    let serviceName = 'Serviço';
    if (finalServiceId) {
        const { data: service } = await supabase.from('services').select('name').eq('id', finalServiceId).single();
        serviceName = service?.name || invitation.service_snapshot?.name || 'Serviço';
    } else if (invitation.service_snapshot?.name) {
        serviceName = invitation.service_snapshot.name;
    }

    // 5. TRANSACTION (Manual)
    
    // A. Marcar como usado
    const { error: updateError } = await supabase.from('invitations').update({ 
        status: 'used', 
        used_at: new Date().toISOString(),
        // Atualiza caso o admin tenha mudado na hora do scan
        service_id: finalServiceId,
        duration: finalDuration
    }).eq('id', invitationId);

    if (updateError) return { success: false, error: 'Erro ao atualizar convite.' };

    // B. Deduzir saldo
    const { error: balanceError } = await supabase.from('profiles').update({
        minutes_balance: host.minutes_balance - finalDuration
    }).eq('id', host.id);

    if (balanceError) {
        await supabase.from('invitations').update({ status: 'active', used_at: null }).eq('id', invitationId);
        return { success: false, error: 'Erro ao deduzir saldo.' };
    }

    // C. Criar Agendamento (Registro)
    const { error: apptError } = await supabase.from('appointments').insert({
        user_id: host.id,
        user_name: `${host.display_name} (Convidado)`,
        user_email: host.email,
        service_name: `GUEST: ${serviceName}`,
        date: new Date().toISOString(),
        duration: finalDuration,
        status: 'Concluído',
        payment_method: 'minutes'
    });

    if (apptError) console.error('Erro ao criar log de agendamento:', apptError);

    revalidatePath('/admin/scan');
    return { success: true };
}