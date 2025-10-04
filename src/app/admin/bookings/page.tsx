
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { BookingsClient } from '@/components/admin/bookings-client';
import { cookies } from 'next/headers';
import type { Profile } from '@/types/profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { format, parse, startOfDay } from 'date-fns';
import { createServerClient } from '@supabase/ssr';

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

// This function is rewritten from scratch to be robust and error-proof.
export async function getAdminData(date?: string) {
  const cookieStore = cookies();
  
  // 1. Create a secure ADMIN client using the service_role key to bypass RLS.
  const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
          cookies: {
              get(name: string) {
                  return cookieStore.get(name)?.value
              },
          },
      }
  );

  // 2. Explicitly validate and format the date to avoid any timezone/format issues.
  let filterDate: string;
  try {
      if (date) {
        // Parse the date string from URL and then re-format it to ensure consistency
        const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
        filterDate = format(parsedDate, 'yyyy-MM-dd');
      } else {
        // If no date is provided, use today's date, formatted correctly
        filterDate = format(new Date(), 'yyyy-MM-dd');
      }
  } catch (error) {
    console.error("Invalid date parameter provided:", date, error);
    // Fallback to today's date if parsing fails
    filterDate = format(new Date(), 'yyyy-MM-dd');
  }


  // 3. Fetch all bookings for that specific date using the ADMIN client and a range query.
  const { data: bookingsData, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .gte('date', `${filterDate}T00:00:00`)
    .lt('date', `${filterDate}T23:59:59`)
    .order('time', { ascending: true });


  if (bookingsError) {
    console.error('Erro ao buscar agendamentos:', bookingsError);
    return { 
        bookings: [], 
        profiles: [], 
        error: `Não foi possível carregar os agendamentos. Erro: ${bookingsError.message}` 
    };
  }

  // 4. Fetch all profiles to create a lookup map. This can also use the admin client.
  const { data: profilesData, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('Erro ao buscar perfis:', profilesError);
    // We don't fail here; we can still show bookings without full profile info.
  }

  // Return early if there are no bookings to process to avoid unnecessary work.
  if (!bookingsData || bookingsData.length === 0) {
      return { bookings: [], profiles: (profilesData as Profile[]) || [], error: null };
  }
  
  // 5. Manually and robustly join bookings with profiles.
  // This ensures that bookings made by non-registered users (null user_id) are ALWAYS included.
  const profilesMap = new Map((profilesData as Profile[] || []).map(p => [p.id, p]));
  
  const bookingsWithProfiles = bookingsData.map(booking => {
      // Find the profile if a user_id exists for the booking
      const profile = booking.user_id ? profilesMap.get(booking.user_id) : null;
      
      return {
          ...booking,
          // Prioritize the name/email stored directly on the booking. Fallback to profile info.
          name: booking.name || profile?.full_name || 'N/A', 
          email: booking.email || profile?.email || 'N/A',
          profiles: profile || null,
      };
  });

  // Sanitize the final data structure to match the 'Booking' type
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
  try {
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
    
    // Pass the correctly fetched data to the client component for rendering.
    return (
      <div className="flex flex-col h-full">
        <BookingsClient initialBookings={bookings} initialProfiles={profiles} selectedDate={selectedDate} />
      </div>
    );
  } catch (error: any) {
     return (
             <div className="container mx-auto py-10">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold tracking-tight text-destructive">Erro ao Carregar Página de Agendamentos</h1>
                    <p className="text-muted-foreground mt-2 bg-destructive/10 p-4 rounded-md">
                        {error.message}
                    </p>
                     <p className="mt-4">
                        Por favor, certifique-se de que o ficheiro `.env.local` foi criado na raiz do projeto e que as variáveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` estão corretamente configuradas.
                    </p>
                </div>
            </div>
        )
  }
}
