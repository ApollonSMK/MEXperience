
import { createClient } from '@/lib/supabase/server';
import { BookingsClient } from '@/components/admin/bookings-client';
import { cookies } from 'next/headers';
import type { Profile } from '@/types/profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

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

async function getAdminData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Fetch all bookings
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('date', { ascending: false });

  if (bookingsError) {
    console.error('Erro ao buscar agendamentos:', bookingsError);
  }

  // Fetch all profiles
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('Erro ao buscar perfis:', profilesError);
  }

  if (!bookingsData || !profilesData) {
      return { bookings: [], profiles: [], error: bookingsError?.message || profilesError?.message };
  }


  // Create a map for quick profile lookup
  const profilesMap = new Map(profilesData.map(p => [p.id, p]));

  // Combine bookings with their corresponding profiles
  const combinedBookings = bookingsData.map(booking => ({
    ...booking,
    profiles: profilesMap.get(booking.user_id) || null,
  }));

  return { bookings: combinedBookings as Booking[], profiles: profilesData as Profile[], error: null };
}


export default async function AdminBookingsPage() {
  const { bookings, profiles, error } = await getAdminData();

  if (error) {
    return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Dados</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os agendamentos. Verifique as suas políticas de RLS (Row Level Security) no Supabase.
             O seu utilizador de administrador precisa de ter permissão para ler as tabelas `bookings` e `profiles`.
            <pre className="mt-2 bg-muted p-2 rounded text-xs">{error}</pre>
          </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gira os agendamentos dos seus clientes. Clique num horário vago para adicionar um agendamento.
          </p>
      </div>
      <div className="flex-grow">
        <BookingsClient bookings={bookings} profiles={profiles} />
      </div>
    </div>
  );
}

    