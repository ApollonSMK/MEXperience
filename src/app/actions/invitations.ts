'use server';

import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { revalidatePath } from 'next/cache';

export async function generateInvitation() {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // 1. Verificar se o user tem um plano ativo
    const { data: profile } = await supabase.from('profiles').select('plan_id, minutes_balance').eq('id', user.id).single();
    
    if (!profile?.plan_id) {
        return { success: false, error: 'Apenas membros subscritos podem gerar convites.' };
    }

    if ((profile?.minutes_balance || 0) <= 0) {
         return { success: false, error: 'Saldo de minutos insuficiente para convidar.' };
    }

    // 2. Criar convite
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