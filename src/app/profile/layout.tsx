
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logout } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import UserProfileCard from '@/components/profile/user-card';
import { subDays, format } from 'date-fns';
import { BackButton } from '@/components/back-button';

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

async function getProfileLayoutData() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // --- Start data fetching in parallel ---
  const profilePromise = supabase
    .from('profiles')
    .select('subscription_plan, role, refunded_minutes')
    .eq('id', user.id)
    .single();

  const thirtyDaysAgo = format(subDays(new Date(), 31), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  const pastBookingsPromise = supabase
    .from('bookings')
    .select('date, duration')
    .eq('user_id', user.id)
    .eq('status', 'Confirmado')
    .gte('date', thirtyDaysAgo)
    .lte('date', today);
  
  const [
    { data: profile, error: profileError },
    { data: pastBookings, error: pastBookingsError },
  ] = await Promise.all([
    profilePromise,
    pastBookingsPromise,
  ]);
  // --- End data fetching ---

  if (profileError) console.error('Error fetching profile:', profileError.message);
  if (pastBookingsError) console.error('Error fetching past bookings:', pastBookingsError.message);

  const subscriptionPlan = profile?.subscription_plan || 'Sem Plano';
  const isAdmin = profile?.role === 'admin';
  const refundedMinutes = profile?.refunded_minutes || 0;

  // --- Prepare data for Usage Chart ---
  const dateRange = Array.from({ length: 31 }, (_, i) => format(subDays(new Date(), i), 'dd/MM')).reverse();
  const dailyUsageMap = new Map<string, number>();
  dateRange.forEach(day => {
      dailyUsageMap.set(day, 0);
  });

  (pastBookings || []).forEach(booking => {
      if (booking.date && booking.duration) {
          const dayKey = format(new Date(booking.date + 'T00:00:00'), 'dd/MM');
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

  return { 
    user, 
    isAdmin,
    usageData,
    subscription,
  };
}

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, usageData, subscription } = await getProfileLayoutData();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <header className="flex items-center justify-between mb-8">
        <div>
          <BackButton />
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
      
      <div className="mb-8">
        <UserProfileCard user={user} isAdmin={isAdmin} subscription={subscription} usageData={usageData} />
      </div>

      {/* The content of the specific page will be rendered here */}
      {children}
    </div>
  );
}

    