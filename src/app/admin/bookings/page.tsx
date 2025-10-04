
import { createClient } from '@/lib/supabase/server';
import { BookingsClient } from '@/components/admin/bookings-client';
import { cookies } from 'next/headers';
import type { Profile } from '@/types/profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export type Booking = {
  id: number;
  created_at: string;
  user_id: string | null; // Can be null
  service_id: string;
  date: string;
  time: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
  name: string | null;
  email: string | null;
  duration: number | null;
  profiles: Profile | null; // The associated profile, can be null
};

export async function getAdminData(date?: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // 1. Determine the filter date explicitly. Default to today.
  // The date from URL param is already in 'yyyy-MM-dd'.
  const filterDate = date 
    ? date
    : format(new Date(), 'yyyy-MM-dd');

  // 2. Fetch all bookings for that specific date.
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .eq('date', filterDate)
    .order('time', { ascending: true });

  if (bookingsError) {
    console.error('Erro ao buscar agendamentos:', bookingsError);
    return { 
        bookings: [], 
        profiles: [], 
        error: `Não foi possível carregar os agendamentos. Erro: ${bookingsError.message}` 
    };
  }

  // 3. Fetch all profiles to create a lookup map.
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('Erro ao buscar perfis:', profilesError);
    return { 
        bookings: [], 
        profiles: [], 
        error: `Não foi possível carregar os perfis. Erro: ${profilesError.message}` 
    };
  }

  // Return early if there are no bookings to process
  if (!bookingsData) {
      return { bookings: [], profiles: (profilesData as Profile[]) || [], error: null };
  }
  
  // 4. Manually and robustly join bookings with profiles.
  // Create a Map for efficient profile lookup.
  const profilesMap = new Map((profilesData as Profile[]).map(p => [p.id, p]));
  
  const bookingsWithProfiles = bookingsData.map(booking => {
      // Find profile only if user_id exists for the booking
      const profile = booking.user_id ? profilesMap.get(booking.user_id) : null;
      
      // Return a combined object. The booking data is the source of truth.
      // The profile is attached if found, otherwise it's null.
      return {
          ...booking,
          // Ensure the name and email from the booking are used, especially if there's no profile.
          name: booking.name || profile?.full_name || 'N/A',
          email: booking.email || 'N/A',
          profiles: profile || null, // Attach full profile or null
      };
  });

  // Ensure every booking has a valid time string to prevent crashes.
  const sanitizedBookings = bookingsWithProfiles.map(b => ({...b, time: b.time || "00:00:00"})) as Booking[];

  return { bookings: sanitizedBookings, profiles: (profilesData as Profile[]) || [], error: null };
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
                {error}
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
