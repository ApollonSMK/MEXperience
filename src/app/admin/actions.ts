
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Booking } from '@/types/booking';
import type { Profile } from '@/types/profile';

// Helper function to create an admin client
const createAdminClient = () => createClient({ auth: { persistSession: false } });


export async function updateBookingStatus(
  bookingId: number,
  status: Booking['status']
) {
  const supabase = createAdminClient();

  if (status === 'Cancelado') {
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('user_id, duration')
        .eq('id', bookingId)
        .single();
      
      if (fetchError || !booking || !booking.user_id) {
          console.error("Error fetching booking or booking has no user:", fetchError);
           // Se não encontrar o user, apenas cancela sem reembolso
          const { error: rpcError } = await supabase.rpc('update_booking_status_as_admin', {
              booking_id: bookingId,
              new_status: 'Cancelado',
          });

          if (rpcError) {
              console.error('Error just canceling booking:', rpcError);
              return { success: false, error: 'Não foi possível cancelar o agendamento.' };
          }
      } else {
        // Chama a nova função RPC que também reembolsa os minutos
        const { error } = await supabase.rpc('cancel_booking_and_refund_minutes', {
            p_booking_id: bookingId,
            p_user_id: booking.user_id,
            p_minutes_to_refund: booking.duration,
        });

         if (error) {
              console.error('Error canceling and refunding booking:', error);
              return { success: false, error: `Não foi possível cancelar e reembolsar: ${error.message}` };
         }
      }

  } else {
    // Para outros status, usa a função antiga que apenas atualiza o estado
    const { error } = await supabase.rpc('update_booking_status_as_admin', {
      booking_id: bookingId,
      new_status: status,
    });

    if (error) {
      console.error('Error updating booking status via RPC:', error);
      return { success: false, error: `Não foi possível atualizar o agendamento: ${error.message}` };
    }
  }

  revalidatePath('/admin/bookings');
  revalidatePath('/profile'); // Revalida a página de perfil para o utilizador ver os minutos
  return { success: true };
}


export async function updateBookingDateTime(
  bookingId: number,
  date: string,
  time: string
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('bookings')
    .update({ date, time })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking date/time:', error);
    return { success: false, error: 'Não foi possível mover o agendamento.' };
  }

  revalidatePath('/admin/bookings');
  return { success: true, data };
}

const NewBookingSchema = z.object({
    user_id: z.string().uuid().optional().or(z.literal('')),
    service_id: z.string(),
    date: z.string(),
    time: z.string(),
    status: z.enum(['Pendente', 'Confirmado', 'Cancelado']),
    duration: z.number().int().positive(),
    name: z.string().nullable(),
    email: z.string().email().nullable(),
});

export async function createBooking(formData: FormData) {
    const supabase = createAdminClient();

    const rawData = {
        user_id: formData.get('user_id') as string,
        service_id: formData.get('service_id') as string,
        date: formData.get('date') as string,
        time: formData.get('time') as string,
        status: formData.get('status') as 'Pendente' | 'Confirmado' | 'Cancelado',
        duration: Number(formData.get('duration')),
        name: formData.get('name') as string | null,
        email: formData.get('email') as string | null,
    };
    
    const validatedFields = NewBookingSchema.safeParse(rawData);
    if (!validatedFields.success) {
        console.error("Booking validation failed:", validatedFields.error.flatten());
        return { success: false, error: 'Dados inválidos para o agendamento.' };
    }

    const { data: bookingPayload } = validatedFields;
    
    const { error } = await supabase.rpc('create_booking_as_admin', {
        p_user_id: bookingPayload.user_id ? bookingPayload.user_id : null,
        p_service_id: bookingPayload.service_id,
        p_date: bookingPayload.date,
        p_time: bookingPayload.time,
        p_status: bookingPayload.status,
        p_duration: bookingPayload.duration,
        p_name: bookingPayload.name,
        p_email: bookingPayload.email,
    });
    
    if (error) {
        console.error('Error creating booking via RPC:', error);
         if (error.code === '42883') { // undefined_function
            return { success: false, error: `A função SQL 'create_booking_as_admin' não foi encontrada. Por favor, crie-a no seu editor SQL do Supabase.` };
        }
        return { success: false, error: `Não foi possível criar o agendamento: ${error.message}` };
    }

    revalidatePath('/admin/bookings');
    return { success: true };
}

export async function deleteBooking(bookingId: number) {
    if (!bookingId) {
        return { success: false, error: 'ID do agendamento inválido.' };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.rpc('delete_booking_as_admin', {
        booking_id: bookingId,
    });

    if (error) {
        console.error('Delete RPC Error:', error);
        if (error.code === '42883') { // undefined_function
            return { success: false, error: `A função SQL 'delete_booking_as_admin' não foi encontrada. Por favor, crie-a no seu editor SQL do Supabase.` };
        }
        return { success: false, error: `Não foi possível eliminar o agendamento: ${error.message}` };
    }

    revalidatePath('/admin/bookings');
    return { success: true };
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'user') {
  const supabase = createAdminClient(); 

  const { data: { user: currentUser } } = createClient();
  if (!currentUser) {
    return { success: false, error: 'Acesso negado. Utilizador não autenticado.' };
  }
  
  if (currentUser.id === userId) {
      return { success: false, error: 'Não pode alterar a sua própria função.'};
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating user role:', updateError);
    return { success: false, error: `Não foi possível atualizar a função: ${updateError.message}` };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

const UpdateProfileSchema = z.object({
    userId: z.string().uuid(),
    subscription_plan: z.string(),
    refunded_minutes: z.coerce.number().int().min(0),
});


export async function updateUserProfile(formData: FormData) {
    const supabase = createAdminClient();

    const rawData = {
        userId: formData.get('userId') as string,
        subscription_plan: formData.get('subscription_plan') as string,
        refunded_minutes: formData.get('refunded_minutes'),
    };

    const validatedFields = UpdateProfileSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error("Profile update validation failed:", validatedFields.error.flatten());
        return { success: false, error: 'Dados inválidos para a atualização do perfil.' };
    }

    const { userId, ...dataToUpdate } = validatedFields.data;

    const { error } = await supabase
        .from('profiles')
        .update(dataToUpdate)
        .eq('id', userId);
    
    if (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error: `Não foi possível atualizar o perfil: ${error.message}` };
    }

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/profile');
    return { success: true };
}
