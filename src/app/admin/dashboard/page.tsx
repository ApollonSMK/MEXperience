'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Bar, BarChart, CartesianGrid, XAxis, LineChart, Line, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Euro, Calendar, Users, Briefcase, BarChart as BarChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  service_name: string;
  date: string; // ISO string
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
  payment_method: 'card' | 'minutes' | 'reception';
}

interface Service {
    id: string;
    name: string;
    pricing_tiers: { duration: number; price: number }[];
}

interface AppointmentWithPrice extends Appointment {
  price: number;
}

const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('');
};

const chartConfig = {
  appointments: {
    label: 'Agendamentos',
    color: 'hsl(var(--primary))',
  },
  sales: {
    label: 'Vendas',
    color: 'hsl(var(--chart-2))',
  }
};

export default function AdminDashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();
  
  const today = useMemo(() => new Date(), []);
  const sevenDaysAgo = useMemo(() => startOfDay(subDays(today, 6)), [today]);
  const sevenDaysFromNow = useMemo(() => endOfDay(subDays(today, -7)), [today]);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const servicesPromise = supabase.from('services').select('*');
    const appointmentsPromise = supabase.from('appointments').select('*').order('date', { ascending: false });

    const [
        { data: servicesData, error: servicesError },
        { data: appointmentsData, error: appointmentsError }
    ] = await Promise.all([servicesPromise, appointmentsPromise]);
    
    if (servicesError) console.error('Error fetching services:', servicesError);
    else setServices(servicesData as Service[] || []);

    if (appointmentsError) console.error('Error fetching appointments:', appointmentsError);
    else setAppointments(appointmentsData as Appointment[] || []);

    setIsLoading(false);
  }, [supabase]);


  useEffect(() => {
    fetchData();
    
    const appointmentChannel = supabase
      .channel('public:appointments:dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Realtime appointment change received in dashboard', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentChannel);
    };
  }, [fetchData, supabase]);


  const servicePriceMap = useMemo(() => {
    if (!services) return new Map();
    const map = new Map<string, number>();
    services.forEach(service => {
        service.pricing_tiers?.forEach(tier => {
            const key = `${service.name}-${tier.duration}`;
            map.set(key, tier.price);
        });
    });
    return map;
  }, [services]);

  const appointmentsWithPrice = useMemo(() => {
    if (!appointments) return [];
    return appointments.map((app): AppointmentWithPrice => {
      const priceKey = `${app.service_name}-${app.duration}`;
      const price = (app.status === 'Concluído' && app.payment_method !== 'minutes') ? (servicePriceMap.get(priceKey) ?? 0) : 0;
      return {
        ...app,
        price: price,
      };
    });
  }, [appointments, servicePriceMap]);

  const recentAppointments = useMemo(() => {
    return appointmentsWithPrice.filter(app => new Date(app.date) >= sevenDaysAgo);
  }, [appointmentsWithPrice, sevenDaysAgo]);


  const { chartData, totalValue } = useMemo(() => {
    const dateInterval = eachDayOfInterval({ start: sevenDaysAgo, end: today });
    const initialData = dateInterval.map(day => ({
        date: format(day, 'yyyy-MM-dd'),
        displayDate: format(day, 'EEE', { locale: ptBR }),
        sales: 0,
        appointments: 0
    }));

    let totalValue = 0;

    if (recentAppointments) {
      recentAppointments.forEach(app => {
          const appDate = new Date(app.date);
          totalValue += app.price;
          const appDateKey = format(appDate, 'yyyy-MM-dd');
          const matchingDay = initialData.find(d => d.date === appDateKey);

          if (matchingDay) {
              if (app.status === 'Concluído' && app.payment_method !== 'minutes') {
                  matchingDay.sales += app.price;
              }
              matchingDay.appointments += 1;
          }
      });
    }

    return { chartData: initialData, totalValue };
  }, [recentAppointments, sevenDaysAgo, today]);


  const upcomingAppointments = useMemo(() => {
    if (!appointmentsWithPrice) return [];
    const now = new Date();
    return appointmentsWithPrice
        .filter(app => new Date(app.date) >= now && new Date(app.date) <= sevenDaysFromNow && app.status === 'Confirmado')
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointmentsWithPrice, sevenDaysFromNow]);
  
  const todaysAppointments = useMemo(() => {
    if (!appointmentsWithPrice) return [];
    return appointmentsWithPrice
        .filter(app => isSameDay(new Date(app.date), today) && app.status === 'Confirmado')
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointmentsWithPrice, today]);

  const appointmentsActivity = useMemo(() => {
    if (!appointmentsWithPrice) return [];
    return appointmentsWithPrice.slice(0, 5);
  }, [appointmentsWithPrice]);
  
  const renderEmptyState = (title: string, message: string) => (
    <CardContent className="flex flex-col items-center justify-center h-full text-center">
        <BarChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
    </CardContent>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <>
                    <p className="text-3xl font-bold">€{totalValue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                        {recentAppointments?.length || 0} agendamentos no total
                    </p>
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full mt-4 -ml-4">
                        <LineChart accessibilityLayer data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                tickFormatter={(value) => `€${value}`}
                             />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Line dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
                            <Line dataKey="appointments" type="monotone" stroke="var(--color-appointments)" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                </>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>Próximos 7 dias</CardDescription>
          </CardHeader>
          {isLoading ? <CardContent><Skeleton className="h-48 w-full" /></CardContent> : (
            upcomingAppointments.length > 0 ? (
                <CardContent className="flex-grow overflow-y-auto">
                    <Table>
                        <TableBody>
                        {upcomingAppointments.map((app) => (
                            <TableRow key={app.id}>
                                <TableCell>
                                    <div className="font-medium">{format(new Date(app.date), 'EEE, d MMM', { locale: ptBR })}</div>
                                    <div className="text-sm text-muted-foreground">{format(new Date(app.date), 'HH:mm')}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{app.service_name}</div>
                                    <div className="text-sm text-muted-foreground">{app.user_name}</div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="default">{app.status}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            ) : renderEmptyState("Agenda vazia", "Não há agendamentos futuros.")
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Atividade de Agendamentos</CardTitle>
          </CardHeader>
          {isLoading ? <CardContent><Skeleton className="h-48 w-full" /></CardContent> : (
            appointmentsActivity.length > 0 ? (
                 <CardContent className="flex-grow overflow-y-auto">
                    <div className="space-y-4">
                        {appointmentsActivity.map(app => (
                            <div key={app.id} className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                     <Avatar className="h-10 w-10">
                                        <AvatarFallback>{getInitials(app.user_name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold flex items-center">{app.service_name} <Badge variant={app.status === 'Confirmado' ? 'default' : app.status === 'Concluído' ? 'secondary' : 'destructive'} className="ml-2">{app.status}</Badge></div>
                                        <p className="text-sm text-muted-foreground">{app.user_name} - {format(new Date(app.date), "d MMM, HH:mm", { locale: ptBR })}</p>
                                    </div>
                                </div>
                                <p className="font-semibold text-sm">€{app.price.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                 </CardContent>
            ) : renderEmptyState("Nenhuma atividade", "Ainda não há agendamentos registrados.")
          )}
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Próximos Agendamentos de Hoje</CardTitle>
          </CardHeader>
            {isLoading ? <CardContent><Skeleton className="h-48 w-full" /></CardContent> : (
            todaysAppointments.length > 0 ? (
                 <CardContent className="flex-grow overflow-y-auto">
                    <Table>
                        <TableBody>
                        {todaysAppointments.map((app) => (
                            <TableRow key={app.id}>
                                <TableCell className="font-medium">{format(new Date(app.date), 'HH:mm')}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{app.service_name}</div>
                                    <div className="text-sm text-muted-foreground">{app.user_name}</div>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                 </CardContent>
            ) : renderEmptyState("Nenhum agendamento para hoje", "A sua agenda para hoje está livre.")
          )}
        </Card>
      </div>
    </div>
  );
}
