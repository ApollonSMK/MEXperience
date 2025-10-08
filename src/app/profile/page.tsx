
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logout } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar, User as UserIcon, CreditCard, BarChart3, Settings, ArrowRight } from 'lucide-react';
import UserProfileCard from '@/components/profile/user-card';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Booking } from '@/types/booking';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
  const profilePromise = supabase
    .from('profiles')
    .select('subscription_plan, role, refunded_minutes')
    .eq('id', user.id)
    .single();

  const today = format(new Date(), 'yyyy-MM-dd');

  const bookingsPromise = supabase
    .from('bookings')
    .select('id, date, time, service_id, status, duration')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  const thirtyDaysAgo = format(subDays(new Date(), 31), 'yyyy-MM-dd');
  const pastBookingsPromise = supabase
    .from('bookings')
    .select('date, duration')
    .eq('user_id', user.id)
    .eq('status', 'Confirmado')
    .gte('date', thirtyDaysAgo)
    .lte('date', today);
  
  const [
    { data: profile, error: profileError },
    { data: bookings, error: bookingsError },
    { data: pastBookings, error: pastBookingsError },
  ] = await Promise.all([
    profilePromise,
    bookingsPromise,
    pastBookingsPromise,
  ]);
  // --- End data fetching ---

  if (profileError) console.error('Error fetching profile:', profileError.message);
  if (bookingsError) console.error('Error fetching bookings:', bookingsError.message);
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

  return { 
    user, 
    isAdmin,
    usageData,
    subscription,
    upcomingBooking,
  };
}


const navItems = [
    { href: '/profile/bookings', icon: Calendar, title: 'Meus Agendamentos', description: 'Veja e gira as suas sessões futuras e passadas.' },
    { href: '/profile/statistics', icon: BarChart3, title: 'Estatísticas', description: 'Analise o seu uso e progresso ao longo do tempo.' },
    { href: '/profile/subscription', icon: CreditCard, title: 'Subscrição', description: 'Gira o seu plano, métodos de pagamento e faturas.' },
    { href: '/profile/user', icon: UserIcon, title: 'Meu Perfil', description: 'Consulte e edite os seus dados pessoais e de acesso.' },
    { href: '/profile/settings', icon: Settings, title: 'Definições', description: 'Atualize as suas preferências de conta e notificações.' },
];


export default async function ProfileDashboardPage() {
  const { user, isAdmin, usageData, subscription, upcomingBooking } = await getProfileData();

  const getPreviewData = (title: string) => {
    switch (title) {
        case 'Meus Agendamentos':
            if (!upcomingBooking) return "Nenhum agendamento futuro";
            const date = format(new Date(upcomingBooking.date), "dd 'de' MMMM", { locale: ptBR });
            return `Próximo: ${date} às ${upcomingBooking.time.substring(0, 5)}`;
        case 'Subscrição':
            return subscription.plan !== 'Sem Plano' ? `Plano atual: ${subscription.plan.replace('Plano ', '')}` : 'Sem plano ativo';
        default:
            return null;
    }
  }

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
      
      <div className="mb-8">
        <UserProfileCard user={user} isAdmin={isAdmin} subscription={subscription} usageData={usageData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navItems.map((item) => {
            const preview = getPreviewData(item.title);
            return (
                <Link href={item.href} key={item.title} className="group">
                    <Card className="h-full flex flex-col transition-all duration-300 ease-in-out hover:border-accent hover:shadow-lg hover:-translate-y-1 bg-white dark:bg-card">
                       <CardHeader className="flex-row gap-4 items-center">
                            <div className="p-3 bg-accent/10 rounded-lg">
                                <item.icon className="w-6 h-6 text-accent" />
                            </div>
                            <CardTitle className="font-headline text-lg text-primary">{item.title}</CardTitle>
                       </CardHeader>
                       <CardContent className="flex-grow">
                            <CardDescription>{item.description}</CardDescription>
                       </CardContent>
                       <div className="px-6 pb-4 flex justify-between items-center text-sm">
                            {preview ? (
                                <p className="text-accent font-semibold text-xs">{preview}</p>
                            ) : (
                                <span></span> // Placeholder for alignment
                            )}
                            <ArrowRight className="w-4 h-4 text-muted-foreground transform transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" />
                       </div>
                    </Card>
                </Link>
            )
        })}
      </div>
    </div>
  );
}
