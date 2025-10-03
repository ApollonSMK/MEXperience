
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { Booking } from './bookings/page';
import { z } from 'zod';

// NOTE: We need to use the admin client to bypass RLS for creating bookings on behalf of users.
const createAdminClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createClient(cookieStore, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}


export async function updateBookingStatus(
  bookingId: number,
  status: Booking['status']
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking status:', error);
    return { success: false, error: 'Não foi possível atualizar o agendamento.' };
  }

  revalidatePath('/admin/bookings');
  return { success: true, data };
}

export async function updateBookingDateTime(
  bookingId: number,
  date: string,
  time: string
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

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
    user_id: z.string(),
    service_id: z.string(),
    date: z.string(),
    time: z.string(),
    status: z.enum(['Pendente', 'Confirmado', 'Cancelado']),
    name: z.string().nullable(),
    email: z.string().email().nullable(),
    duration: z.number().int().positive(),
});

export async function createBooking(formData: FormData) {
    const cookieStore = cookies();
    // Use the admin client to bypass RLS.
    const supabase = createAdminClient(cookieStore);

    const payload = {
        user_id: formData.get('user_id') as string,
        service_id: formData.get('service_id') as string,
        date: formData.get('date') as string,
        time: formData.get('time') as string,
        status: formData.get('status') as 'Pendente' | 'Confirmado' | 'Cancelado',
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        duration: Number(formData.get('duration'))
    };
    
    const validatedData = NewBookingSchema.safeParse(payload);
    if (!validatedData.success) {
        console.error("Booking validation failed:", validatedData.error.flatten());
        return { success: false, error: 'Dados inválidos para o agendamento.' };
    }

    const { data, error } = await supabase
        .from('bookings')
        .insert(validatedData.data)
        .select()
        .single();
    
    if (error) {
        console.error('Error creating booking:', error);
        return { success: false, error: `Não foi possível criar o agendamento: ${error.message}` };
    }

    revalidatePath('/admin/bookings');
    return { success: true, data };
}

export async function deleteBooking(bookingId: number) {
    if (!bookingId) {
        return { success: false, error: 'ID do agendamento inválido.' };
    }

    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId);
        
        if (error) {
            console.error('Delete Error:', error);
            return { success: false, error: `Não foi possível eliminar o agendamento: ${error.message}` };
        }

        revalidatePath('/admin/bookings');
        return { success: true };

    } catch (e: any) {
        console.error('Catch Error:', e);
        return { success: false, error: e.message || 'Ocorreu um erro inesperado no servidor ao eliminar.' };
    }
}
