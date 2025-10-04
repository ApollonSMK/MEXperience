
import { createClient } from '@supabase/supabase-js';
import { getServices } from '@/lib/services-db';
import { BookingsClient } from '@/components/admin/bookings-client';
import { format, isValid, parseISO } from 'date-fns';
import type { Booking } from '@/types/booking';
import type { Profile } from '@/types/profile';

// Esta função corre no servidor com privilégios de administrador
async function getAdminData(filterDate: string): Promise<{ bookings: Booking[], profiles: Profile[] }> {
  // Criar um cliente de admin PURO, sem cookies, para garantir acesso total
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Consulta robusta usando o intervalo de datas que você sugeriu
  const { data: bookingsData, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .gte('date', `${filterDate}T00:00:00`)
    .lt('date', `${filterDate}T23:59:59`)
    .order('time', { ascending: true });

  if (bookingsError) {
    console.error("Erro CRÍTICO ao buscar agendamentos como admin:", bookingsError);
    // Mesmo com erro, retornamos um array vazio para não quebrar a página
    return { bookings: [], profiles: [] };
  }

  // Buscar todos os perfis para fazer a correspondência
  // Não precisamos de RLS aqui, pois o objetivo é mostrar dados para o admin
  const { data: profilesData, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error("Erro ao buscar perfis como admin:", profilesError);
  }

  return {
    bookings: (bookingsData as Booking[]) || [],
    profiles: (profilesData as Profile[]) || [],
  };
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  let selectedDate: Date;

  // Validação rigorosa da data da URL
  if (searchParams.date && isValid(parseISO(searchParams.date))) {
    selectedDate = parseISO(searchParams.date);
  } else {
    selectedDate = new Date();
  }
  
  // Formatar a data para 'yyyy-MM-dd' para usar no filtro
  const filterDate = format(selectedDate, 'yyyy-MM-dd');

  const { bookings, profiles } = await getAdminData(filterDate);
  const services = await getServices();
  
  // Mapear os perfis por ID para fácil acesso
  const profilesMap = new Map(profiles.map(p => [p.id, p]));

  // Combinar dados do agendamento com dados do perfil
  const combinedBookings: Booking[] = bookings.map(booking => {
    const profile = booking.user_id ? profilesMap.get(booking.user_id) : undefined;
    return {
      ...booking,
      // Se houver perfil, use o nome do perfil. Senão, use o nome guardado no agendamento.
      name: profile?.full_name || booking.name,
      email: profile?.email || booking.email,
      // Adicionar URL do avatar se o perfil existir
      avatar_url: profile?.avatar_url,
    };
  });

  return (
    <BookingsClient
      initialDate={selectedDate}
      bookings={combinedBookings}
      services={services}
    />
  );
}
