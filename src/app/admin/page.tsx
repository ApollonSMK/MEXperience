'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Bar, BarChart, CartesianGrid, XAxis, LineChart, Line, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Euro, Calendar, Users, Briefcase, BarChart as BarChartIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay, addDays, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

interface Invoice {
    id: string;
    date: string; // ISO string
    amount: number;
    status: string;
}

const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('');
};

const chartConfig = {
  appointments: {
    label: 'Rendez-vous',
    color: 'hsl(var(--primary))',
  },
  sales: {
    label: 'Ventes',
    color: 'hsl(var(--chart-2))',
  }
};

export default function AdminDashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();
  
  const today = useMemo(() => new Date(), []);
  const sevenDaysAgo = useMemo(() => startOfDay(subDays(today, 6)), [today]);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const invoicesPromise = supabase.from('invoices').select('*');
    const appointmentsPromise = supabase.from('appointments').select('*').order('date', { ascending: false });

    const [
        { data: invoicesData, error: invoicesError },
        { data: appointmentsData, error: appointmentsError }
    ] = await Promise.all([invoicesPromise, appointmentsPromise]);
    
    if (invoicesError) console.error('Error fetching invoices:', invoicesError);
    else setInvoices(invoicesData as Invoice[] || []);

    if (appointmentsError) console.error('Error fetching appointments:', appointmentsError);
    else setAppointments(appointmentsData as Appointment[] || []);

    setIsLoading(false);
  }, [supabase]);


  useEffect(() => {
    fetchData();
    
    const changesChannel = supabase
      .channel('public-changes-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(changesChannel);
    };
  }, [fetchData, supabase]);

  const recentInvoices = useMemo(() => {
    return invoices.filter(inv => new Date(inv.date) >= sevenDaysAgo);
  }, [invoices, sevenDaysAgo]);

  const { chartData, totalValue } = useMemo(() => {
    const dateInterval = eachDayOfInterval({ start: sevenDaysAgo, end: today });
    const initialData = dateInterval.map(day => ({
        date: format(day, 'yyyy-MM-dd'),
        displayDate: format(day, 'EEE', { locale: fr }),
        sales: 0,
        appointments: 0
    }));

    let totalValue = 0;

    recentInvoices.forEach(inv => {
        const invDate = new Date(inv.date);
        totalValue += inv.amount;
        const invDateKey = format(invDate, 'yyyy-MM-dd');
        const matchingDay = initialData.find(d => d.date === invDateKey);
        if (matchingDay) {
            matchingDay.sales += inv.amount;
        }
    });

    appointments.forEach(app => {
        const appDate = new Date(app.date);
        const appDateKey = format(appDate, 'yyyy-MM-dd');
        const matchingDay = initialData.find(d => d.date === appDateKey);
        if(matchingDay) {
            matchingDay.appointments += 1;
        }
    })

    return { chartData: initialData, totalValue };
  }, [recentInvoices, appointments, sevenDaysAgo, today]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));
    
    let currentMonthRevenue = 0;
    let prevMonthRevenue = 0;

    invoices.forEach(inv => {
        const invDate = new Date(inv.date);
        if (isWithinInterval(invDate, { start: currentMonthStart, end: currentMonthEnd })) {
            currentMonthRevenue += inv.amount;
        }
        if (isWithinInterval(invDate, { start: prevMonthStart, end: prevMonthEnd })) {
            prevMonthRevenue += inv.amount;
        }
    });

    let percentageChange = 0;
    if (prevMonthRevenue > 0) {
        percentageChange = ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
    } else if (currentMonthRevenue > 0) {
        percentageChange = 100; // Se o mês anterior foi 0, qualquer valor é 100% de aumento
    }

    return {
        currentMonthRevenue,
        percentageChange,
    };
  }, [invoices]);


  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = endOfDay(addDays(now, 7));
    return appointments
        .filter(app => new Date(app.date) >= now && new Date(app.date) <= sevenDaysFromNow && app.status === 'Confirmado')
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments]);
  
  const todaysAppointments = useMemo(() => {
    return appointments
        .filter(app => isSameDay(new Date(app.date), today) && app.status === 'Confirmado')
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, today]);

  const appointmentsActivity = useMemo(() => {
    return appointments.slice(0, 5);
  }, [appointments]);
  
  const renderEmptyState = (title: string, message: string) => (
    <CardContent className="flex flex-col items-center justify-center h-full text-center">
        <BarChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
    </CardContent>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ventes Récentes</CardTitle>
            <CardDescription>7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <>
                    <p className="text-3xl font-bold">€{totalValue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                        {recentInvoices.length || 0} transactions au total
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
        
        <Card>
            <CardHeader>
                <CardTitle>Facturation Mensuelle</CardTitle>
                <CardDescription>Revenu pour le mois de {format(today, 'MMMM', { locale: fr })}.</CardDescription>
            </CardHeader>
             <CardContent>
                {isLoading ? <Skeleton className="h-48 w-full" /> : (
                    <div className="space-y-4">
                        <p className="text-4xl font-bold">€{monthlyStats.currentMonthRevenue.toFixed(2)}</p>
                        <div className={cn(
                            "flex items-center text-sm font-medium",
                            monthlyStats.percentageChange >= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                            {monthlyStats.percentageChange >= 0 ? 
                                <ArrowUp className="h-4 w-4 mr-1" /> : 
                                <ArrowDown className="h-4 w-4 mr-1" />
                            }
                            {monthlyStats.percentageChange.toFixed(1)}% vs. le mois dernier
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Activité des Rendez-vous</CardTitle>
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
                                        <p className="text-sm text-muted-foreground">{app.user_name} - {format(new Date(app.date), "d MMM, HH:mm", { locale: fr })}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </CardContent>
            ) : renderEmptyState("Aucune activité", "Aucun rendez-vous n'a encore été enregistré.")
          )}
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Prochains Rendez-vous</CardTitle>
            <CardDescription>7 prochains jours</CardDescription>
          </CardHeader>
          {isLoading ? <CardContent><Skeleton className="h-48 w-full" /></CardContent> : (
            upcomingAppointments.length > 0 ? (
                <CardContent className="flex-grow overflow-y-auto">
                    <Table>
                        <TableBody>
                        {upcomingAppointments.map((app) => (
                            <TableRow key={app.id}>
                                <TableCell>
                                    <div className="font-medium">{format(new Date(app.date), 'EEE, d MMM', { locale: fr })}</div>
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
            ) : renderEmptyState("Agenda vide", "Aucun rendez-vous à venir.")
          )}
        </Card>

      </div>
    </div>
  );
}
