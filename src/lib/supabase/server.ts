
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Booking } from '@/types/booking';


// Admin client creation is now part of this file.
// We pass an 'isAdmin' flag to determine which key to use.
export const createClient = (isAdmin = false) => {
  const cookieStore = (cookies() as unknown as UnsafeUnwrappedCookies);

  const supabaseKey = isAdmin
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || !supabaseKey) {
    const missingVar = !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : 
                       !supabaseKey ? (isAdmin ? "SUPABASE_SERVICE_ROLE_KEY" : "NEXT_PUBLIC_SUPABASE_ANON_KEY") 
                       : "Supabase key";
    throw new Error(
      `Supabase variable ${missingVar} is missing. Make sure you have a .env.local file with all required Supabase variables.`
    );
  }

  // The options object is now dynamically created inside the function.
  const options = {
      auth: {
        autoRefreshToken: !isAdmin,
        persistSession: !isAdmin,
        detectSessionInUrl: !isAdmin,
      },
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      ...options,
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

// --- ADMIN ACTIONS MOVED HERE ---

// Helper function to create an admin client
const createAdminClient = () => createClient(true);


export async function updateBookingStatus(
  bookingId: number,
  status: Booking['status']
) {
  const supabase = createAdminClient();

  const { error } = await supabase.rpc('update_booking_status_as_admin', {
    booking_id: bookingId,
    new_status: status,
  });

  if (error) {
    console.error('Error updating booking status via RPC:', error);
    if (error.code === '42883') { // undefined_function
      return { success: false, error: `A função SQL 'update_booking_status_as_admin' não foi encontrada. Por favor, crie-a no seu editor SQL do Supabase.` };
    }
    return { success: false, error: `Não foi possível atualizar o agendamento: ${error.message}` };
  }

  revalidatePath('/admin/bookings');
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
