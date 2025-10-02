
import { createClient } from '@/lib/supabase/server';
import { BookingsClient } from '@/components/admin/bookings-client';
import { cookies } from 'next/headers';
import type { Profile } from '@/types/profile';

export type Booking = {
  id: number;
  created_at: string;
  user_id: string;
  service_id: string;
  date: string;
  time: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
  name: string | null;
  email: string | null;
  duration: number | null;
  profiles: Profile | null; // This will be populated manually
};

async function getBookings() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Fetch all bookings
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('date', { ascending: false });

  if (bookingsError) {
    console.error('Erro ao buscar agendamentos:', bookingsError);
    return [];
  }

  // Fetch all profiles
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('Erro ao buscar perfis:', profilesError);
    // Return bookings without profile data if profiles fail
    return bookingsData.map(b => ({ ...b, profiles: null })) as Booking[];
  }

  // Create a map for quick profile lookup
  const profilesMap = new Map(profilesData.map(p => [p.id, p]));

  // Combine bookings with their corresponding profiles
  const combinedBookings = bookingsData.map(booking => ({
    ...booking,
    profiles: profilesMap.get(booking.user_id) || null,
  }));

  return combinedBookings as Booking[];
}


export default async function AdminBookingsPage() {
  const bookings = await getBookings();

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gira os agendamentos dos seus clientes.
          </p>
      </div>
      <div className="flex-grow">
        <BookingsClient bookings={bookings} />
      </div>
    </div>
  );
}
