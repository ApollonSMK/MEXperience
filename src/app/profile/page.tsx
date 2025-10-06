
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logout } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import UserProfileCard from '@/components/profile/user-card';
import BookingsCard from '@/components/profile/bookings-card';
import SubscriptionCard from '@/components/profile/subscription-card';
import { subDays, format, eachDayOfInterval } from 'date-fns';
import { getServices } from '@/lib/services-db';
import RadarCard from '@/components/profile/radar-card';
import type { Service } from '@/lib/services';
import type { RadarUsageData } from '@/types/usage';

type Booking = {
  id: number;
  date: string;
  time: string;
  service_id: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
};

type PastBooking = {
  date: string;
  duration: number;
  service_id: string;
};

type DailyUsage = {
  date: string;
  minutes: number;
};

const PLAN_MINUTES: { [key: string]: number } = {
  'Plano Bronze': 50,
  'Plano Prata': 90,
  'Plano Gold': 130,
  'Sem Plano': 0,
};

async function getProfileData() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const servicesPromise = getServices();
  
  const profilePromise = supabase
    .from('profiles')
    .select('subscription_plan, role, refunded_minutes')
    .eq('id', user.id)
    .single();

  const upcomingBookingsPromise = supabase
    .from('bookings')
    .select('id, date, time, service_id, status')
    .eq('user_id', user.id)
    .in('status', ['Confirmado', 'Pendente'])
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('time', { ascending: true })
    .limit(1);

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const pastBookingsPromise = supabase
    .from('bookings')
    .select('date, duration, service_id')
    .eq('user_id', user.id)
    .eq('status', 'Confirmado')
    .gte('date', thirtyDaysAgo)
    .lte('date', today);
  
  const allTimeBookingsPromise = supabase
    .from('bookings')
    .select('service_id')
    .eq('user_id', user.id)
    .eq('status', 'Confirmado');

  const [
    services,
    { data: profile, error: profileError },
    { data: upcomingBookings, error: upcomingError },
    { data: pastBookings, error: pastBookingsError },
    { data: allTimeBookings, error: allTimeBookingsError },
  ] = await Promise.all([
    servicesPromise,
    profilePromise,
    upcomingBookingsPromise,
    pastBookingsPromise,
    allTimeBookingsPromise
  ]);


  if (profileError) console.error('Error fetching profile:', profileError.message);
  if (upcomingError) console.error('Error fetching upcoming bookings:', upcomingError);
  if (pastBookingsError) console.error('Error fetching past bookings:', pastBookingsError.message);
  if (allTimeBookingsError) console.error('Error fetching all time bookings:', allTimeBookingsError.message);


  const subscriptionPlan = profile?.subscription_plan || 'Sem Plano';
  const isAdmin = profile?.role === 'admin';
  const refundedMinutes = profile?.refunded_minutes || 0;
  
  let usageData: DailyUsage[] = [];
  if (pastBookings && pastBookings.length > 0) {
      const dailyUsage = (pastBookings as PastBooking[]).reduce((acc: Record<string, number>, booking) => {
        if (booking.date && booking.duration) {
          const day = format(new Date(booking.date), 'dd/MM');
          acc[day] = (acc[day] || 0) + booking.duration;
        }
        return acc;
      }, {});
      usageData = Object.entries(dailyUsage).map(([date, minutes]) => ({ date, minutes }));
  } else {
      const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
      usageData = last7Days.map(day => ({ date: format(day, 'dd/MM'), minutes: 0 }));
  }
  
  const subscription = {
    plan: subscriptionPlan,
    totalMinutes: PLAN_MINUTES[subscriptionPlan] || 0,
    refundedMinutes: refundedMinutes,
  };

  const serviceMap = new Map<string, string>(services.map((s: Service) => [s.id, s.name]));
  const serviceUsage: RadarUsageData[] = [];
  
  if (allTimeBookings) {
    const usageCounts = allTimeBookings.reduce((acc: Record<string, number>, booking) => {
      const serviceName = serviceMap.get(booking.service_id);
      if (serviceName) {
        acc[serviceName] = (acc[serviceName] || 0) + 1;
      }
      return acc;
    }, {});
    
    // Find the max count to scale the 'fullMark'
    const maxCount = Math.max(...Object.values(usageCounts), 0);

    for (const [serviceName, count] of Object.entries(usageCounts)) {
      serviceUsage.push({
        service: serviceName,
        count: count,
        fullMark: Math.max(5, maxCount), // Ensure a minimum fullMark
      });
    }
  }


  return { 
    user, 
    upcomingBooking: upcomingBookings?.[0] as Booking | undefined, 
    isAdmin,
    usageData,
    subscription,
    serviceUsage,
  };
}

export default async function ProfileDashboardPage() {
  const { user, upcomingBooking, isAdmin, usageData, subscription, serviceUsage } = await getProfileData();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
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
        <div className="lg:col-span-2 flex flex-col gap-6">
          <UserProfileCard user={user} isAdmin={isAdmin} subscription={subscription} usageData={usageData} />
          <SubscriptionCard subscription={subscription} usageData={usageData} />
        </div>

        {/* Coluna da Direita */}
        <div className="flex flex-col gap-6">
          <BookingsCard upcomingBooking={upcomingBooking} />
          <RadarCard data={serviceUsage} />
        </div>
      </div>
    </div>
  );
}
