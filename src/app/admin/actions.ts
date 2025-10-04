
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { Booking } from './bookings/page';
import { z } from 'zod';
import type { Profile } from '@/types/profile';
import { redirect } from 'next/navigation';

const ADMIN_EMAIL = 'contact@me-experience.lu';

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
    duration: z.number().int().positive(),
    name: z.string().nullable(),
    email: z.string().email().nullable(),
});

export async function createBooking(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createAdminClient(cookieStore);

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

    const { user_id, ...restOfData } = validatedFields.data;

    // Fetch the user's profile to ensure the name is up-to-date, but don't fail if it doesn't exist
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user_id)
        .single();
    
    // Combine form data with fetched profile name if available, otherwise use what was passed
    const bookingData = {
        user_id: user_id,
        ...restOfData,
        name: profile?.full_name || validatedFields.data.name,
    };


    const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
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


export async function updateUserRole(userId: string, newRole: 'admin' | 'user') {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Acesso negado. Utilizador não autenticado.' };
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isHardcodedAdmin = user.email === ADMIN_EMAIL;
  const isRoleAdmin = adminProfile?.role === 'admin';
  
  if (!isHardcodedAdmin && !isRoleAdmin) {
    return { success: false, error: 'Acesso negado. Apenas administradores podem alterar funções.' };
  }
  
  if (user.id === userId && isHardcodedAdmin) {
      return { success: false, error: 'Não pode alterar a função do administrador principal.'};
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
