
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logout } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import UserProfileCard from '@/components/profile/user-card';
import SubscriptionCard from '@/components/profile/subscription-card';
import BookingsCard from '@/components/profile/bookings-card';
import RadarCard from '@/components/profile/radar-card';
import { subDays, format, eachDayOfInterval } from 'date-fns';
import { getServices } from '@/lib/services-db';
import type { Service } from '@/lib/services';
import type { Booking } from '@/types/booking';
import type { RadarUsageData } from '@/types/usage';

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

  // --- Start data fetching in parallel ---
  const servicesPromise = getServices();

  const profilePromise = supabase
    .from('profiles')
    .select('subscription_plan, role, refunded_minutes')
    .eq('id', user.id)
    .single();

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const bookingsPromise = supabase
    .from('bookings')
    .select('id, date, time, service_id, status, duration')
    .eq('user_id', user.id)
    .order('date', { ascending: false });
  
  const [
    services,
    { data: profile, error: profileError },
    { data: bookings, error: bookingsError },
  ] = await Promise.all([
    servicesPromise,
    profilePromise,
    bookingsPromise,
  ]);
  // --- End data fetching ---

  if (profileError) console.error('Error fetching profile:', profileError.message);
  if (bookingsError) console.error('Error fetching bookings:', bookingsError.message);

  const subscriptionPlan = profile?.subscription_plan || 'Sem Plano';
  const isAdmin = profile?.role === 'admin';
  const refundedMinutes = profile?.refunded_minutes || 0;

  // --- Prepare data for Usage Chart ---
  const dateRange = eachDayOfInterval({ start: subDays(new Date(), 31), end: new Date() });
  const dailyUsageMap = new Map<string, number>();
  dateRange.forEach(day => {
      dailyUsageMap.set(format(day, 'dd/MM'), 0);
  });

  const pastBookings = bookings?.filter(b => b.date < today && b.status === 'Confirmado') || [];

  pastBookings.forEach(booking => {
      if (booking.date && booking.duration) {
          const dayKey = format(new Date(booking.date), 'dd/MM');
          if (dailyUsageMap.has(dayKey)) {
              dailyUsageMap.set(dayKey, (dailyUsageMap.get(dayKey) || 0) + booking.duration);
          }
      }
  });

  const usageData: DailyUsage[] = Array.from(dailyUsageMap, ([date, minutes]) => ({ date, minutes }));

  // --- Prepare data for Subscription Card ---
  const subscription = {
    plan: subscriptionPlan,
    totalMinutes: PLAN_MINUTES[subscriptionPlan] || 0,
    refundedMinutes: refundedMinutes,
  };

  // --- Prepare data for Bookings Card ---
  const upcomingBooking = (bookings as Booking[] | null)
    ?.filter(b => b.date >= today && b.status !== 'Cancelado')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time))[0];

  // --- Prepare data for Radar Chart ---
  const serviceUsageMap = new Map<string, number>();
  services.forEach(s => serviceUsageMap.set(s.name, 0));

  pastBookings.forEach(booking => {
      const service = services.find(s => s.id === booking.service_id);
      if (service) {
          serviceUsageMap.set(service.name, (serviceUsageMap.get(service.name) || 0) + 1);
      }
  });
  
  const maxCount = Math.max(...Array.from(serviceUsageMap.values()), 1);

  const radarData: RadarUsageData[] = Array.from(serviceUsageMap, ([service, count]) => ({
      service,
      count,
      fullMark: maxCount,
  })).filter(item => services.some(s => s.name === item.service && s.allowed_plans?.includes(subscription.plan)));


  return { 
    user, 
    isAdmin,
    usageData,
    subscription,
    upcomingBooking,
    radarData,
  };
}


export default async function ProfileDashboardPage() {
  const { user, isAdmin, usageData, subscription, upcomingBooking, radarData } = await getProfileData();

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
            <RadarCard data={radarData} />
        </div>
      </div>
    </div>
  );
}
