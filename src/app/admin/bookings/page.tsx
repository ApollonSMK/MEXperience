
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { BookingsClient } from '@/components/admin/bookings-client';
import { cookies } from 'next/headers';
import type { Profile } from '@/types/profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
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

export async function getAdminData(date?: string) {
  const cookieStore = cookies();
  
  // Criar um cliente de ADMINISTRAÇÃO seguro que usa a chave de serviço
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

  // 1. Determine the filter date explicitly. Default to today.
  const filterDate = date 
    ? date
    : format(new Date(), 'yyyy-MM-dd');

  // 2. Fetch all bookings for that specific date using the ADMIN client to bypass RLS.
  const { data: bookingsData, error: bookingsError } = await supabaseAdmin
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

  // 3. Fetch all profiles to create a lookup map (can use the admin client too)
  const { data: profilesData, error: profilesError } = await supabaseAdmin
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
  const profilesMap = new Map((profilesData as Profile[]).map(p => [p.id, p]));
  
  const bookingsWithProfiles = bookingsData.map(booking => {
      const profile = booking.user_id ? profilesMap.get(booking.user_id) : null;
      
      return {
          ...booking,
          // Use o nome do agendamento primeiro, depois o do perfil e, por último, um fallback.
          name: booking.name || profile?.full_name || 'N/A', 
          // Use o email do agendamento primeiro, depois o do perfil e, por último, um fallback.
          email: booking.email || profile?.email || 'N/A',
          profiles: profile || null,
      };
  });

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
