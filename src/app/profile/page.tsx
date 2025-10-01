import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { logout } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import UserProfileCard from '@/components/profile/user-card';
import BookingsCard from '@/components/profile/bookings-card';
import SubscriptionCard from '@/components/profile/subscription-card';

const ADMIN_EMAIL = 'contact@me-experience.lu';
const MAX_BOOKINGS_PER_DAY = 8; // Define o limite de agendamentos por dia

type Booking = {
  id: number;
  date: string;
  time: string;
  service_id: string;
};

async function getProfileData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Busca o próximo agendamento do usuário
  const { data: upcomingBookings, error: upcomingError } = await supabase
    .from('bookings')
    .select('id, date, time, service_id')
    .eq('user_id', user.id)
    .eq('status', 'Confirmado')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('time', { ascending: true })
    .limit(1);

  if (upcomingError) {
    console.error('Error fetching upcoming bookings:', upcomingError);
  }

  // Busca todos os agendamentos para calcular os dias cheios
  const { data: allBookings, error: allBookingsError } = await supabase
    .from('bookings')
    .select('date')
    .eq('status', 'Confirmado')
    .gte('date', new Date().toISOString().split('T')[0]);

  if (allBookingsError) {
    console.error('Error fetching all bookings:', allBookingsError);
  }

  const bookingCountsByDate = (allBookings || []).reduce((acc, booking) => {
    acc[booking.date] = (acc[booking.date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const disabledDates = Object.entries(bookingCountsByDate)
    .filter(([, count]) => count >= MAX_BOOKINGS_PER_DAY)
    .map(([date]) => new Date(date));

  const isAdmin = user.email === ADMIN_EMAIL;
  
  return { 
    user, 
    upcomingBooking: upcomingBookings?.[0] as Booking | undefined, 
    isAdmin,
    disabledDates
  };
}

export default async function ProfileDashboardPage() {
  const { user, upcomingBooking, isAdmin, disabledDates } = await getProfileData();
  
  // Fake subscription data for now
  const subscription = {
    plan: 'Plano Bronze',
    usedMinutes: 25,
    totalMinutes: 50,
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <header className="flex items-center justify-between mb-8">
        <div>
          <p className="text-muted-foreground">Bem-vindo(a) de volta,</p>
          <h1 className="text-3xl font-bold font-headline text-primary">
            {user.user_metadata?.full_name || 'Utilizador'}
          </h1>
        </div>
        <form action={logout}>
          <Button variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </form>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna da Esquerda */}
        <div className="lg:col-span-2 space-y-6">
           <BookingsCard upcomingBooking={upcomingBooking} disabledDates={disabledDates} />
           <SubscriptionCard subscription={subscription} />
        </div>

        {/* Coluna da Direita */}
        <div className="lg:col-span-1 space-y-6">
           <UserProfileCard user={user} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}
