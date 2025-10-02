
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { Booking } from './bookings/page';

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

  // revalidatePath('/admin/bookings'); // Removido para evitar que o calendário volte ao dia de hoje
  return { success: true, data };
}
