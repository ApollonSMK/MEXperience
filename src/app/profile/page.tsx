
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logout } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { LogOut, User, Calendar, BarChart3, CreditCard, Settings, Shield } from 'lucide-react';
import UserProfileCard from '@/components/profile/user-card';
import { subDays, format, eachDayOfInterval } from 'date-fns';
import Link from 'next/link';

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
  
  const profilePromise = supabase
    .from('profiles')
    .select('subscription_plan, role, refunded_minutes')
    .eq('id', user.id)
    .single();

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
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


  if (profileError) console.error('Error fetching profile:', profileError.message);
  if (pastBookingsError) console.error('Error fetching past bookings:', pastBookingsError.message);

  const subscriptionPlan = profile?.subscription_plan || 'Sem Plano';
  const isAdmin = profile?.role === 'admin';
  const refundedMinutes = profile?.refunded_minutes || 0;
  
  const dateRange = eachDayOfInterval({ start: subDays(new Date(), 30), end: new Date() });
  const dailyUsageMap = new Map<string, number>();
  dateRange.forEach(day => {
      dailyUsageMap.set(format(day, 'dd/MM'), 0);
  });

  if (pastBookings) {
      (pastBookings as {date: string, duration: number}[]).forEach(booking => {
          if (booking.date && booking.duration) {
              const dayKey = format(new Date(booking.date), 'dd/MM');
              if (dailyUsageMap.has(dayKey)) {
                  dailyUsageMap.set(dayKey, (dailyUsageMap.get(dayKey) || 0) + booking.duration);
              }
          }
      });
  }
  
  const usageData: DailyUsage[] = Array.from(dailyUsageMap, ([date, minutes]) => ({ date, minutes }));
  
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


const navItems = [
  { href: '/profile/bookings', label: 'Meus Agendamentos', icon: Calendar },
  { href: '/profile/user', label: 'Meu Perfil', icon: User },
  { href: '/profile/subscription', label: 'Subscrição', icon: CreditCard },
  { href: '/profile/statistics', label: 'Estatísticas', icon: BarChart3 },
  { href: '/profile/settings', label: 'Definições', icon: Settings },
];

export default async function ProfileDashboardPage() {
  const { user, isAdmin, usageData, subscription } = await getProfileData();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
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

      <div className="space-y-8">
        <UserProfileCard user={user} isAdmin={isAdmin} subscription={subscription} usageData={usageData} />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="outline"
              className="h-24 flex-col justify-center gap-2 text-base bg-card hover:bg-muted text-card-foreground border"
            >
              <Link href={item.href}>
                <item.icon className="w-6 h-6 text-accent" />
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
