
import { createClient } from '@/lib/supabase/server';
import { getServices } from '@/lib/services-db';
import { BookingsClient } from '@/components/admin/bookings-client';
import { format, isValid, parseISO, addDays } from 'date-fns';
import type { Booking } from '@/types/booking';
import type { Profile } from '@/types/profile';
import { cookies } from 'next/headers';

async function getAdminData(filterDate: string): Promise<{ bookings: Booking[], profiles: Profile[] }> {
  const cookieStore = cookies();
  const supabaseAdmin = createClient({
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const startDate = filterDate;
  const endDate = format(addDays(new Date(filterDate), 1), 'yyyy-MM-dd');

  const bookingsPromise = supabaseAdmin
    .from('bookings')
    .select('*')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('time', { ascending: true });

  const profilesPromise = supabaseAdmin
    .rpc('get_all_users_with_profiles');

  const [{ data: bookingsData, error: bookingsError }, { data: profilesData, error: profilesError }] = await Promise.all([bookingsPromise, profilesPromise]);

  if (bookingsError) {
    console.error("Erro ao buscar agendamentos como admin:", bookingsError);
  }

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
  const dateParam = searchParams.date;
  const selectedDate = dateParam && isValid(parseISO(dateParam))
    ? parseISO(dateParam)
    : new Date();
  
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
      initialDateString={filterDate}
      bookings={combinedBookings}
      services={services}
      profiles={profiles}
    />
  );
}
