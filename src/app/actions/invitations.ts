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

    // 4. DEDUZIR SALDO (Transação simulada)
    const { error: balanceError } = await supabase
        .from('profiles')
        .update({ minutes_balance: currentBalance - duration })
        .eq('id', user.id);

    if (balanceError) return { success: false, error: 'Erro ao debitar saldo.' };

    // 5. Criar convite
    const { data, error } = await supabase.from('invitations').insert({
        host_user_id: user.id,
        status: 'active',
        service_id: serviceId,
        duration: duration,
        service_snapshot: { name: service.name }
    }).select().single();

    // Rollback se falhar a criação do convite
    if (error) {
        await supabase.from('profiles')
            .update({ minutes_balance: currentBalance }) // Devolve o saldo
            .eq('id', user.id);
        return { success: false, error: error.message };
    }
    
    revalidatePath('/profile/invite');
    return { success: true, data };
}

export async function cancelInvitation(invitationId: string) {
    const supabase = await createSupabaseRouteClient();
    
    // 1. Buscar convite para saber quanto reembolsar
    const { data: invite } = await supabase
        .from('invitations')
        .select('duration, status, host_user_id')
        .eq('id', invitationId)
        .single();

    if (!invite) return { success: false, error: 'Convite não encontrado.' };
    if (invite.status !== 'active') return { success: false, error: 'Apenas convites ativos podem ser cancelados.' };

    // 2. Buscar saldo atual do host
    const { data: host } = await supabase
        .from('profiles')
        .select('minutes_balance')
        .eq('id', invite.host_user_id)
        .single();
    
    if (!host) return { success: false, error: 'Host não encontrado.' };

    // 3. Cancelar convite
    const { error: updateError } = await supabase.from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

    if (updateError) return { success: false, error: updateError.message };

    // 4. REEMBOLSAR SALDO
    await supabase.from('profiles')
        .update({ minutes_balance: (host.minutes_balance || 0) + (invite.duration || 0) })
        .eq('id', invite.host_user_id);

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
        return { success: false, error: 'Duração não definida.' };
    }

    // 4. Buscar nome do serviço para histórico
    let serviceName = 'Serviço';
    if (finalServiceId) {
        const { data: service } = await supabase.from('services').select('name').eq('id', finalServiceId).single();
        serviceName = service?.name || invitation.service_snapshot?.name || 'Serviço';
    } else if (invitation.service_snapshot?.name) {
        serviceName = invitation.service_snapshot.name;
    }

    // LÓGICA DE AJUSTE DE SALDO (Caso o admin altere a duração na porta)
    // Se a duração final for diferente da original do convite, ajustamos a diferença.
    if (duration && duration !== invitation.duration) {
        const difference = duration - invitation.duration; // ex: era 30, virou 45 -> dif +15 (deduz mais). era 30, virou 20 -> dif -10 (reembolsa).
        
        // Verificar se tem saldo para o extra
        if (difference > 0 && host.minutes_balance < difference) {
             return { success: false, error: `Saldo insuficiente para o tempo extra (${difference} min).` };
        }

        // Ajustar saldo
        await supabase.from('profiles').update({
            minutes_balance: host.minutes_balance - difference
        }).eq('id', host.id);
    }

    // 5. TRANSACTION (Manual)
    
    // A. Marcar como usado
    const { error: updateError } = await supabase.from('invitations').update({ 
        status: 'used', 
        used_at: new Date().toISOString(),
        service_id: finalServiceId,
        duration: finalDuration
    }).eq('id', invitationId);

    if (updateError) return { success: false, error: 'Erro ao atualizar convite.' };

    // B. Criar Agendamento (Registro)
    const { error: apptError } = await supabase.from('appointments').insert({
        user_id: host.id,
        user_name: `${host.display_name} (Convidado)`,
        user_email: host.email,
        service_name: `GUEST: ${serviceName}`,
        date: new Date().toISOString(),
        duration: finalDuration,
        status: 'Concluído',
        payment_method: 'minutes' // Minutos já foram deduzidos
    });

    if (apptError) console.error('Erro ao criar log de agendamento:', apptError);

    revalidatePath('/admin/scan');
    return { success: true };
}