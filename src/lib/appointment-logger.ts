import { SupabaseClient } from '@supabase/supabase-js';

type LogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESCHEDULE' | 'COMPLETE' | 'PAYMENT';

export const logAppointmentAction = async (
    supabase: SupabaseClient, 
    action: LogAction, 
    appointmentId: string | undefined, 
    details: string, 
    oldData?: any, 
    newData?: any
) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('appointment_logs').insert({
            action_type: action,
            performed_by: user.id,
            appointment_id: appointmentId,
            details: details,
            old_data: oldData,
            new_data: newData
        });
    } catch (error) {
        console.error("Falha ao gravar log:", error);
        // Não queremos que o erro de log pare o fluxo principal, então apenas logamos no console
    }
};