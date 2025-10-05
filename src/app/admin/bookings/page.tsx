
import { createClient } from '@/lib/supabase/server';
import { getServices } from '@/lib/services-db';
import { BookingsClient } from '@/components/admin/bookings-client';
import { format, isValid, parseISO, addDays } from 'date-fns';
import type { Booking } from '@/types/booking';
import type { Profile } from '@/types/profile';

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAdminData(filterDate: string): Promise<{ bookings: Booking[], profiles: Profile[] }> {
  const supabaseAdmin = createClient({ auth: { persistSession: false } });

  const startDate = filterDate;
  const endDate = format(addDays(parseISO(filterDate), 1), 'yyyy-MM-dd');

  const bookingsPromise = supabaseAdmin
    .rpc('get_all_bookings_with_details', { 
        start_date: startDate, 
        end_date: endDate 
    });

  const profilesPromise = supabaseAdmin
    .rpc('get_all_users_with_profiles');

  const [
    { data: bookingsData, error: bookingsError },
    { data: profilesData, error: profilesError }
  ] = await Promise.all([bookingsPromise, profilesPromise]);


  if (bookingsError) {
    console.error("Erro ao buscar agendamentos como admin via RPC:", bookingsError);
    if (bookingsError.code === '42883') {
         throw new Error(`A função RPC 'get_all_bookings_with_details' não foi encontrada. Por favor, execute o SQL necessário no seu editor SQL do Supabase para criá-la.`);
    }
    // Não lançar erro para outros casos, apenas logar.
    // throw new Error("Não foi possível carregar os agendamentos.");
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
  const dateParam = searchParams?.date;
  const selectedDate = dateParam && isValid(parseISO(dateParam))
    ? parseISO(dateParam)
    : new Date();
  
  const filterDate = format(selectedDate, 'yyyy-MM-dd');

  try {
    const { bookings, profiles } = await getAdminData(filterDate);
    const services = await getServices();
    
    return (
      <BookingsClient
        initialDateString={filterDate}
        bookings={bookings}
        services={services}
        profiles={profiles}
      />
    );
  } catch (error: any) {
     return (
             <div className="container mx-auto py-10">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold tracking-tight text-destructive">Erro ao Carregar Agendamentos</h1>
                    <p className="text-muted-foreground mt-2 bg-destructive/10 p-4 rounded-md">
                        {error.message}
                    </p>
                    {error.message.includes('A função RPC') && (
                         <div className="mt-4 p-4 border rounded-md bg-muted/50">
                            <h3 className="font-semibold text-lg">Ação Necessária: Criar Função SQL</h3>
                            <p className="mt-2 text-sm">Copie e cole o seguinte código SQL no seu <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="underline font-bold text-accent">Editor SQL do Supabase</a> e clique em "RUN" para corrigir o erro:</p>
                            <pre className="mt-4 bg-black text-white p-4 rounded-md text-xs overflow-x-auto">
{`CREATE OR REPLACE FUNCTION get_all_bookings_with_details(start_date date, end_date date)
RETURNS TABLE (
    id int8,
    created_at timestamptz,
    user_id uuid,
    service_id text,
    date date,
    "time" time,
    status text,
    duration int4,
    name text,
    email text,
    avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        b.id,
        b.created_at,
        b.user_id,
        b.service_id,
        b.date,
        b.time,
        b.status,
        b.duration,
        COALESCE(b.name, p.full_name, u.raw_user_meta_data->>'full_name') AS name,
        COALESCE(b.email, u.email) AS email,
        COALESCE(p.avatar_url, u.raw_user_meta_data->>'picture') AS avatar_url
    FROM
        public.bookings b
    LEFT JOIN
        public.profiles p ON b.user_id = p.id
    LEFT JOIN
        auth.users u ON b.user_id = u.id
    WHERE
        b.date >= start_date AND b.date < end_date
    ORDER BY
        b.time ASC;
$$;
`}
                            </pre>
                        </div>
                    )}
                     {error.message.includes("'update_booking_status_as_admin'") && (
                         <div className="mt-4 p-4 border rounded-md bg-muted/50">
                            <h3 className="font-semibold text-lg">Ação Necessária: Criar Função SQL de Atualização</h3>
                            <p className="mt-2 text-sm">Parece que também falta a função para atualizar o estado. Copie e cole o seguinte código SQL no seu <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="underline font-bold text-accent">Editor SQL do Supabase</a> e clique em "RUN":</p>
                            <pre className="mt-4 bg-black text-white p-4 rounded-md text-xs overflow-x-auto">
{`CREATE OR REPLACE FUNCTION update_booking_status_as_admin(
    booking_id integer,
    new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Como a função é SECURITY DEFINER, esta operação ignora as políticas RLS.
    UPDATE public.bookings
    SET status = new_status
    WHERE id = booking_id;
END;
$$;
`}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        )
  }
}
