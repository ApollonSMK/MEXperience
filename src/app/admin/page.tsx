'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { Bar, BarChart, CartesianGrid, XAxis, LineChart, Line, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Euro, Calendar, Users, Briefcase, BarChart as BarChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  userId: string;
  serviceName: string;
  date: Timestamp;
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
  paymentMethod: 'card' | 'minutes' | 'reception';
}

interface User {
  id: string;
  displayName?: string;
  email: string;
  photoURL?: string;
}

interface Service {
    id: string;
    name: string;
    pricingTiers: { duration: number; price: number }[];
}

interface PopulatedAppointment extends Appointment {
  userName: string;
  userEmail: string;
  userAvatar: string;
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
  const firestore = useFirestore();

  const today = useMemo(() => new Date(), []);
  const sevenDaysAgo = useMemo(() => startOfDay(subDays(today, 6)), [today]);
  const sevenDaysFromNow = useMemo(() => endOfDay(subDays(today, -7)), [today]);

  // --- DATA FETCHING ---
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersCollectionRef);

  const servicesCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'services');
  }, [firestore]);
  const { data: services, isLoading: isLoadingServices } = useCollection<Service>(servicesCollectionRef);
  
  const recentAppointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'appointments'), 
        where('date', '>=', sevenDaysAgo),
        orderBy('date', 'desc')
    );
  }, [firestore, sevenDaysAgo]);
  const { data: recentAppointments, isLoading: isLoadingAppointments } = useCollection<Appointment>(recentAppointmentsQuery);

  const servicePriceMap = useMemo(() => {
    if (!services) return new Map();
    const map = new Map<string, number>();
    services.forEach(service => {
        service.pricingTiers?.forEach(tier => {
            const key = `${service.name}-${tier.duration}`;
            map.set(key, tier.price);
        });
    });
    return map;
  }, [services]);

  const populatedAppointments = useMemo(() => {
    if (!recentAppointments || !users) return [];
    return recentAppointments.map((app): PopulatedAppointment => {
      const user = users.find(u => u.id === app.userId);
      const priceKey = `${app.serviceName}-${app.duration}`;
      const price = (app.status === 'Concluído' && app.paymentMethod !== 'minutes') ? (servicePriceMap.get(priceKey) ?? 0) : 0;
      return {
        ...app,
        userName: user?.displayName || 'Utilizador Desconhecido',
        userEmail: user?.email || '',
        userAvatar: user?.photoURL || '',
        price: price,
      };
    });
  }, [recentAppointments, users, servicePriceMap]);


  const { chartData, totalValue } = useMemo(() => {
    const dateInterval = eachDayOfInterval({ start: sevenDaysAgo, end: today });
    const initialData = dateInterval.map(day => ({
        date: format(day, 'yyyy-MM-dd'),
        displayDate: format(day, 'EEE', { locale: ptBR }),
        sales: 0,
        appointments: 0
    }));

    let totalValue = 0;

    if (populatedAppointments) {
      populatedAppointments.forEach(app => {
          const appDate = app.date.toDate();
          totalValue += app.price;
          const appDateKey = format(appDate, 'yyyy-MM-dd');
          const matchingDay = initialData.find(d => d.date === appDateKey);

          if (matchingDay) {
              if (app.status === 'Concluído' && app.paymentMethod !== 'minutes') {
                  matchingDay.sales += app.price;
              }
              matchingDay.appointments += 1;
          }
      });
    }

    return { chartData: initialData, totalValue };
  }, [populatedAppointments, sevenDaysAgo, today]);


  const upcomingAppointments = useMemo(() => {
    if (!populatedAppointments) return [];
    const now = new Date();
    return populatedAppointments
        .filter(app => app.date.toDate() >= now && app.date.toDate() <= sevenDaysFromNow && app.status === 'Confirmado')
        .sort((a,b) => a.date.toMillis() - b.date.toMillis());
  }, [populatedAppointments, sevenDaysFromNow]);
  
  const todaysAppointments = useMemo(() => {
    if (!populatedAppointments) return [];
    return populatedAppointments
        .filter(app => isSameDay(app.date.toDate(), today) && app.status === 'Confirmado')
        .sort((a,b) => a.date.toMillis() - b.date.toMillis());
  }, [populatedAppointments, today]);

  const appointmentsActivity = useMemo(() => {
    if (!populatedAppointments) return [];
    // Last 5 appointments regardless of status
    return populatedAppointments.slice(0, 5);
  }, [populatedAppointments]);

  const isLoading = isLoadingUsers || isLoadingServices || isLoadingAppointments;
  
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
        {/* Recent Sales */}
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
                        {populatedAppointments.length} agendamentos no total
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

        {/* Upcoming Appointments */}
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
                                    <div className="font-medium">{format(app.date.toDate(), 'EEE, d MMM', { locale: ptBR })}</div>
                                    <div className="text-sm text-muted-foreground">{format(app.date.toDate(), 'HH:mm')}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{app.serviceName}</div>
                                    <div className="text-sm text-muted-foreground">{app.userName}</div>
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
        {/* Appointments Activity */}
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
                                        <AvatarImage src={app.userAvatar} alt={app.userName} />
                                        <AvatarFallback>{getInitials(app.userName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{app.serviceName} <Badge variant={app.status === 'Confirmado' ? 'default' : app.status === 'Concluído' ? 'secondary' : 'destructive'} className="ml-2">{app.status}</Badge></p>
                                        <p className="text-sm text-muted-foreground">{app.userName} - {format(app.date.toDate(), "d MMM, HH:mm", { locale: ptBR })}</p>
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

        {/* Today's Next Appointments */}
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
                                <TableCell className="font-medium">{format(app.date.toDate(), 'HH:mm')}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{app.serviceName}</div>
                                    <div className="text-sm text-muted-foreground">{app.userName}</div>
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
