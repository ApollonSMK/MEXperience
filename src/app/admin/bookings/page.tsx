
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

  // A política de segurança RLS impede a leitura direta da tabela `bookings` por um administrador.
  // Para contornar isso de forma segura, o administrador chama uma função RPC (`get_all_bookings_for_admin`)
  // que só retorna dados se o chamador for o administrador (verificação interna na função).
  // Esta função precisa ser criada na sua base de dados Supabase.
  const { data, error } = await supabase.rpc('get_all_bookings_for_admin');

  if (error) {
    console.error('Erro ao buscar agendamentos via RPC:', error);
    // Adiciona um log mais claro para debugging, caso a função RPC não exista.
    if (error.code === '42883') { // Código de erro para "function does not exist" no PostgreSQL
        console.error("DICA: A função `get_all_bookings_for_admin` não foi encontrada. Por favor, crie-a no editor de SQL do Supabase para que o calendário do admin funcione.");
    }
    return [];
  }
  
  // O tipo de retorno da RPC pode ser `unknown`, então fazemos um type assertion
  return data as Booking[];
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
