
'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar, User as UserIcon, CreditCard, BarChart3, Settings, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Booking } from '@/types/booking';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const PLAN_MINUTES: { [key: string]: number } = {
  'Plano Bronze': 50,
  'Plano Prata': 90,
  'Plano Gold': 130,
  'Sem Plano': 0,
};

const navItems = [
    { href: '/profile/bookings', icon: Calendar, title: 'Meus Agendamentos', description: 'Veja e gira as suas sessões futuras e passadas.' },
    { href: '/profile/statistics', icon: BarChart3, title: 'Estatísticas', description: 'Analise o seu uso e progresso ao longo do tempo.' },
    { href: '/profile/subscription', icon: CreditCard, title: 'Subscrição', description: 'Gira o seu plano, métodos de pagamento e faturas.' },
    { href: '/profile/user', icon: UserIcon, title: 'Meu Perfil', description: 'Consulte e edite os seus dados pessoais e de acesso.' },
    { href: '/profile/settings', icon: Settings, title: 'Definições', description: 'Atualize as suas preferências de conta e notificações.' },
];

export default function ProfileDashboardPage() {
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | undefined>(undefined);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function getDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        redirect('/login');
        return;
      }

      const today = format(new Date(), 'yyyy-MM-dd');

      const bookingsPromise = supabase
        .from('bookings')
        .select('id, date, time, service_id, status, duration')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const profilePromise = supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .single();

      const [
        { data: bookings, error: bookingsError },
        { data: profile, error: profileError },
      ] = await Promise.all([
        bookingsPromise,
        profilePromise,
      ]);

      if (bookingsError) console.error('Error fetching bookings for dashboard:', bookingsError.message);
      if (profileError) console.error('Error fetching profile for dashboard:', profileError.message);
      
      const nextBooking = (bookings as Booking[] | null)
        ?.filter(b => b.date >= today && b.status !== 'Cancelado')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time))[0];

      setUpcomingBooking(nextBooking);
      setSubscriptionPlan(profile?.subscription_plan || 'Sem Plano');
      setIsLoading(false);
    }
    
    getDashboardData();

    const channel = supabase
      .channel('realtime-profile-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
           // Re-fetch data on any change
           getDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);


  const getPreviewData = (title: string) => {
    switch (title) {
        case 'Meus Agendamentos':
            if (isLoading) return "A carregar...";
            if (!upcomingBooking) return "Nenhum agendamento futuro";
            const date = format(new Date(upcomingBooking.date), "dd 'de' MMMM", { locale: ptBR });
            return `Próximo: ${date} às ${upcomingBooking.time.substring(0, 5)}`;
        case 'Subscrição':
            if (isLoading) return "A carregar...";
            return subscriptionPlan && subscriptionPlan !== 'Sem Plano' ? `Plano atual: ${subscriptionPlan.replace('Plano ', '')}` : 'Sem plano ativo';
        default:
            return null;
    }
  }

  return (
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
                            <CardDescription className="text-muted-foreground">{item.description}</CardDescription>
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
  );
}
