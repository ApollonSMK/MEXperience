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
import { subDays, format } from 'date-fns';

const ADMIN_EMAIL = 'contact@me-experience.lu';

type Booking = {
  id: number;
  date: string;
  time: string;
  service_id: string;
};

type PastBooking = {
  date: string;
  duration: number;
};

type DailyUsage = {
  date: string;
  minutes: number;
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

  // Fetch upcoming booking
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
  
  // Fetch past bookings for the chart
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: pastBookings, error: pastBookingsError } = await supabase
    .from('bookings')
    .select('date, duration')
    .eq('user_id', user.id)
    .eq('status', 'Confirmado') // Assuming 'Confirmado' means completed for past dates
    .gte('date', thirtyDaysAgo)
    .lte('date', today);

  if (pastBookingsError) {
    console.error('Error fetching past bookings:', pastBookingsError.message);
  }

  const dailyUsage = (pastBookings as PastBooking[] || []).reduce((acc: Record<string, number>, booking) => {
    if (booking.date && booking.duration) {
      const day = format(new Date(booking.date), 'dd/MM');
      acc[day] = (acc[day] || 0) + booking.duration;
    }
    return acc;
  }, {});

  const usageData: DailyUsage[] = Object.entries(dailyUsage).map(([date, minutes]) => ({
    date,
    minutes,
  }));

  const isAdmin = user.email === ADMIN_EMAIL;
  
  return { 
    user, 
    upcomingBooking: upcomingBookings?.[0] as Booking | undefined, 
    isAdmin,
    usageData
  };
}

export default async function ProfileDashboardPage() {
  const { user, upcomingBooking, isAdmin, usageData } = await getProfileData();
  
  // Fake subscription data for now, but we use real usage data for the chart
  const subscription = {
    plan: 'Plano Bronze',
    totalMinutes: 50, // Example total
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
           <BookingsCard upcomingBooking={upcomingBooking} />
           <SubscriptionCard subscription={subscription} usageData={usageData} />
        </div>

        {/* Coluna da Direita */}
        <div className="lg:col-span-1 space-y-6">
           <UserProfileCard user={user} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}
