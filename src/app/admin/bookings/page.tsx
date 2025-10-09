
import { createClient } from '@/lib/supabase/server';
import { getServices } from '@/lib/services-db';
import { BookingsClient } from '@/components/admin/bookings-client';
import { format, isValid, parseISO, addDays } from 'date-fns';
import type { Booking } from '@/types/booking';
import type { Profile } from '@/types/profile';

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAdminData(filterDate: string): Promise<{ bookings: Booking[], profiles: Profile[] }> {
  // Use o cliente admin para ignorar as RLS
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
     if (bookingsError) throw bookingsError;
  }

  if (profilesError) {
    console.error("Erro ao buscar perfis como admin:", profilesError);
    if (profilesError.message.includes('column "refunded_minutes" does not exist')) {
        throw new Error(`A coluna 'refunded_minutes' não foi encontrada na tabela 'profiles'.`);
    }
     if (profilesError) throw profilesError;
  }
  
  const profiles = (profilesData as Profile[]) || [];
  profiles.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

  return {
    bookings: (bookingsData as Booking[]) || [],
    profiles,
  };
}

export default async function AdminBookingsPage(
    props: {
      searchParams: Promise<{ date?: string }>;
    }
) {
    const searchParams = await props.searchParams;
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
                      {(error.message.includes('A função RPC') || error.message.includes("column \"refunded_minutes\"") || error.code === 'P0001' || error.message.includes("cancel_booking_and_refund_minutes") || error.message.includes("permission denied")) && (
                           <div className="mt-4 p-4 border rounded-md bg-muted/50">
                              <h3 className="font-semibold text-lg">Ação Necessária: Atualizar Base de Dados e Permissões</h3>
                              <p className="mt-2 text-sm">Detectamos que a sua base de dados pode estar desatualizada ou com permissões incorretas. Copie e cole o seguinte código SQL no seu <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="underline font-bold text-accent">Editor SQL do Supabase</a> e clique em "RUN" para corrigir os erros de uma vez por todas:</p>
                              <pre className="mt-4 bg-black text-white p-4 rounded-md text-xs overflow-x-auto">
  {`-- 1. CORREÇÃO DAS PERMISSÕES E COLUNAS DA TABELA 'bookings' (AGENDAMENTOS)

-- Adiciona a coluna para o QR Code Token, se ainda não existir.
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;

-- Habilita a Row Level Security (RLS) se ainda não estiver ativa.
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar conflitos.
DROP POLICY IF EXISTS "Users can view their own bookings." ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can view all booking times." ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings." ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings." ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings." ON public.bookings;

-- Política 1 (LEITURA): Permite que utilizadores AUTENTICADOS leiam os SEUS PRÓPRIOS agendamentos.
-- Isto é crucial e corrige o erro que impedia os utilizadores de verem a sua lista.
CREATE POLICY "Users can view their own bookings."
ON public.bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política 2 (INSERÇÃO): Utilizadores podem criar agendamentos para si mesmos.
CREATE POLICY "Users can insert their own bookings."
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política 3 (ATUALIZAÇÃO): Utilizadores podem atualizar os SEUS PRÓPRIOS agendamentos.
CREATE POLICY "Users can update their own bookings."
ON public.bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política 4 (ELIMINAÇÃO): Utilizadores podem eliminar os SEUS PRÓPRIOS agendamentos.
CREATE POLICY "Users can delete their own bookings."
ON public.bookings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 2. CORREÇÕES DAS FUNÇÕES E COLUNAS (SE NECESSÁRIO)

-- Adiciona a coluna para os minutos reembolsados, se ainda não existir.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS refunded_minutes integer DEFAULT 0;

-- Cria ou substitui a função para obter todos os agendamentos, garantindo que os dados do utilizador são obtidos corretamente.
CREATE OR REPLACE FUNCTION get_all_bookings_with_details(start_date date, end_date date)
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
      avatar_url text,
      qr_token text
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
          COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', b.name) AS name,
          COALESCE(u.email, b.email) AS email,
          COALESCE(p.avatar_url, u.raw_user_meta_data->>'picture') AS avatar_url,
          b.qr_token
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
  
-- Atualiza a função de cancelamento para garantir que lida com valores nulos na coluna refunded_minutes.
CREATE OR REPLACE FUNCTION cancel_booking_and_refund_minutes(p_booking_id integer, p_user_id uuid, p_minutes_to_refund integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atualiza o estado do agendamento para 'Cancelado'
    UPDATE public.bookings
    SET status = 'Cancelado'
    WHERE id = p_booking_id;

    -- Adiciona os minutos reembolsados ao perfil do utilizador, tratando o caso da coluna ser nula com COALESCE.
    UPDATE public.profiles
    SET refunded_minutes = COALESCE(refunded_minutes, 0) + p_minutes_to_refund
    WHERE id = p_user_id;
END;
$$;

-- Função original para atualizar o estado (para estados que não sejam 'Cancelado').
CREATE OR REPLACE FUNCTION update_booking_status_as_admin(
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

-- Função para criar agendamentos como admin.
CREATE OR REPLACE FUNCTION create_booking_as_admin(
    p_user_id uuid,
    p_service_id text,
    p_date date,
    p_time time,
    p_status text,
    p_duration integer,
    p_name text,
    p_email text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  new_qr_token TEXT;
BEGIN
  new_qr_token := extensions.uuid_generate_v4();
  INSERT INTO public.bookings (user_id, service_id, date, "time", status, duration, name, email, qr_token)
  VALUES (p_user_id, p_service_id, p_date, p_time, p_status, p_duration, p_name, p_email, new_qr_token);
END;
$$;

-- Função para eliminar agendamentos como admin.
CREATE OR REPLACE FUNCTION delete_booking_as_admin(booking_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
    DELETE FROM public.bookings
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
