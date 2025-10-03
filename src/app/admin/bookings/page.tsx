
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

  const filterDate = date ? format(new Date(`${date}T00:00:00`), 'yyyy-MM-dd') : format(startOfDay(new Date()), 'yyyy-MM-dd');

  // Fetch bookings for the selected date
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .eq('date', filterDate)
    .order('time', { ascending: true });

  if (bookingsError) {
    console.error('Erro ao buscar agendamentos:', bookingsError);
  }
  
  // Fetch all profiles to link with bookings, now including email from auth.users
  // This RPC function needs to be created in your Supabase project.
  // SQL for get_all_users():
  /*
    create or replace function get_all_users()
    returns table (
        id uuid,
        created_at timestamptz,
        full_name text,
        avatar_url text,
        email text,
        phone text,
        subscription_plan text
    )
    language sql
    security definer
    as $$
        select
            u.id,
            u.created_at,
            p.full_name,
            p.avatar_url,
            u.email,
            u.phone,
            p.subscription_plan
        from auth.users u
        left join public.profiles p on u.id = p.id;
    $$;
  */
  const { data: profilesData, error: profilesError } = await supabase
    .rpc('get_all_users');


  if (profilesError) {
    console.error('Erro ao buscar perfis:', profilesError);
    return { 
        bookings: [], 
        profiles: [], 
        error: `Não foi possível carregar os perfis. Verifique se a função RPC 'get_all_users' existe na sua base de dados Supabase. Erro: ${profilesError.message}` 
    };
  }

  if (!bookingsData) {
      return { bookings: [], profiles: profilesData as Profile[] || [], error: bookingsError?.message };
  }
  
  // Manually join bookings with profiles
  const profilesMap = new Map((profilesData as Profile[]).map(p => [p.id, p]));
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
                {error}
                <p className="mt-4 font-bold">Para corrigir, execute o seguinte SQL no seu Editor de SQL do Supabase:</p>
                <pre className="mt-2 bg-muted p-2 rounded text-xs whitespace-pre-wrap">
{`create or replace function get_all_users()
returns table (
    id uuid,
    created_at timestamptz,
    full_name text,
    avatar_url text,
    email text,
    phone text,
    subscription_plan text
)
language sql
security definer
as $$
    select
        u.id,
        u.created_at,
        p.full_name,
        p.avatar_url,
        u.email,
        u.phone,
        p.subscription_plan
    from auth.users u
    left join public.profiles p on u.id = p.id;
$$;`}
                </pre>
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
