
import { createClient } from '@/lib/supabase/server';
import { getServices } from '@/lib/services-db';
import { BookingsClient } from '@/components/admin/bookings-client';
import { format, isValid, parseISO } from 'date-fns';
import type { Booking } from '@/types/booking';
import type { Profile } from '@/types/profile';
import { cookies } from 'next/headers';

// Esta função corre no servidor com privilégios de administrador
async function getAdminData(filterDate: string): Promise<{ bookings: Booking[], profiles: Profile[] }> {
  const cookieStore = cookies();
  // Criar um cliente de admin PURO, sem cookies, para garantir acesso total
  const supabaseAdmin = createClient({
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: bookingsData, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('date', filterDate)
    .order('time', { ascending: true });

  if (bookingsError) {
    console.error("Erro CRÍTICO ao buscar agendamentos como admin:", bookingsError);
    return { bookings: [], profiles: [] };
  }

  // Buscar todos os perfis para o formulário de novo agendamento usando a função RPC
  const { data: profilesData, error: profilesError } = await supabaseAdmin
    .rpc('get_all_users_with_profiles');

  if (profilesError) {
    console.error("Erro ao buscar perfis como admin:", profilesError);
  }
  
  const profiles = (profilesData as Profile[]) || [];
  profiles.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

  return {
    bookings: (bookingsData as Booking[]) || [],
    profiles,
  };
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  let selectedDate: Date;

  const dateParam = searchParams.date;
  if (dateParam && isValid(parseISO(dateParam))) {
    selectedDate = parseISO(dateParam);
  } else {
    selectedDate = new Date();
  }
  
  const filterDate = format(selectedDate, 'yyyy-MM-dd');

  const { bookings, profiles } = await getAdminData(filterDate);
  const services = await getServices();
  
  const profilesMap = new Map(profiles.map(p => [p.id, p]));

  const combinedBookings: Booking[] = bookings.map(booking => {
    const profile = booking.user_id ? profilesMap.get(booking.user_id) : undefined;
    return {
      ...booking,
      name: profile?.full_name || booking.name,
      email: profile?.email || booking.email,
      avatar_url: profile?.avatar_url,
    };
  });

  return (
    <BookingsClient
      initialDate={selectedDate}
      bookings={combinedBookings}
      services={services}
      profiles={profiles}
    />
  );
}
