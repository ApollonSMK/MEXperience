
import { createClient } from '@/lib/supabase/server';
import { BookingsClient } from '@/components/admin/bookings-client';
import { cookies } from 'next/headers';
import type { Profile } from '@/types/profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { format, startOfDay } from 'date-fns';

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
  profiles: Profile | null;
};

export async function getAdminData(date?: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const filterDate = date ? format(new Date(date), 'yyyy-MM-dd') : format(startOfDay(new Date()), 'yyyy-MM-dd');

  // Fetch bookings for the selected date
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .eq('date', filterDate)
    .order('time', { ascending: true });

  if (bookingsError) {
    console.error('Erro ao buscar agendamentos:', bookingsError);
  }
  
  // Fetch all profiles to link with bookings
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('Erro ao buscar perfis:', profilesError);
  }

  if (!bookingsData || !profilesData) {
      return { bookings: [], profiles: [], error: bookingsError?.message || profilesError?.message };
  }
  
  // Manually join bookings with profiles
  const profilesMap = new Map(profilesData.map(p => [p.id, p]));
  const bookingsWithProfiles = bookingsData.map(booking => ({
      ...booking,
      profiles: profilesMap.get(booking.user_id) || null,
  }));


  // Ensure we have a valid time for each booking
  const sanitizedBookings = bookingsWithProfiles.map(b => ({...b, time: b.time || "00:00:00"})) as Booking[]

  return { bookings: sanitizedBookings, profiles: profilesData as Profile[], error: null };
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: {
    date?: string;
  };
}) {
  const selectedDate = searchParams?.date;
  const { bookings, profiles, error } = await getAdminData(selectedDate);

  if (error) {
    return (
        <div className="m-4">
            <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar Dados</AlertTitle>
            <AlertDescription>
                Não foi possível carregar os agendamentos. Verifique as suas políticas de RLS (Row Level Security) no Supabase. O seu utilizador de administrador precisa de ter permissão para ler as tabelas `bookings` e `profiles`.
                <pre className="mt-2 bg-muted p-2 rounded text-xs whitespace-pre-wrap">{error}</pre>
            </AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <BookingsClient initialBookings={bookings} initialProfiles={profiles} selectedDate={selectedDate} />
    </div>
  );
}
