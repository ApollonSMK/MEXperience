
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
  profiles: Profile | null;
};

async function getBookings() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // A política de segurança RLS impede a leitura direta da tabela `bookings`.
  // Para contornar isso de forma segura, o administrador usa uma função RPC (`get_all_bookings_for_admin`)
  // que só retorna dados se o chamador for o administrador.
  // Esta função precisa ser criada na sua base de dados Supabase.
  const { data, error } = await supabase.rpc('get_all_bookings_for_admin');

  if (error) {
    console.error('Error fetching bookings via rpc:', error);
    // Adicionar um log mais claro para debugging, caso a função RPC não exista.
    if (error.code === '42883') { // "function does not exist"
        console.error("Hint: A função `get_all_bookings_for_admin` não foi encontrada. Por favor, crie-a no editor de SQL do Supabase.");
    }
    return [];
  }
  
  return data as unknown as Booking[];
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
