'use server';

import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { revalidatePath } from 'next/cache';

export async function checkInAppointment(appointmentId: string) {
    const supabase = await createSupabaseRouteClient();
    
    // 1. Verificar Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) throw new Error('Apenas admins podem realizar check-in.');

    // 2. Buscar Agendamento
    const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

    if (fetchError || !appointment) {
        return { success: false, error: 'Agendamento não encontrado.' };
    }

    if (appointment.status === 'Concluído') {
        return { success: false, error: 'Este agendamento já foi realizado.' };
    }

    if (appointment.status === 'Cancelado') {
        return { success: false, error: 'Este agendamento está cancelado.' };
    }

    // 3. Atualizar Status
    const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'Concluído' }) // Ou um status específico "Check-in" se tiver
        .eq('id', appointmentId);

    if (updateError) return { success: false, error: 'Erro ao atualizar agendamento.' };

    revalidatePath('/admin/appointments');
    return { success: true, data: appointment };
}