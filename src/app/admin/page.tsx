'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, limit, collection } from 'firebase/firestore';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, Euro, Calendar, Users, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const chartData = [
  { month: 'Janeiro', revenue: 1860 },
  { month: 'Fevereiro', revenue: 2050 },
  { month: 'Março', revenue: 2370 },
  { month: 'Abril', revenue: 1980 },
  { month: 'Maio', revenue: 2540 },
  { month: 'Junho', revenue: 2890 },
];

const chartConfig = {
  revenue: {
    label: 'Receita',
    color: 'hsl(var(--primary))',
  },
};

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  // Fetch all users
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<any>(usersCollectionRef);

  // Fetch recent appointments using a collection group query
  const recentAppointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'appointments'), orderBy('date', 'desc'), limit(5));
  }, [firestore]);
  const { data: recentAppointments, isLoading: isLoadingAppointments } = useCollection<any>(recentAppointmentsQuery);
  
  // Fetch all appointments for stats
  const allAppointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'appointments'), orderBy('date', 'desc'));
  }, [firestore]);
  const { data: allAppointments, isLoading: isLoadingAllAppointments } = useCollection<any>(allAppointmentsQuery);
  
  // Fetch all plans for revenue calculation
  const plansCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'plans');
  }, [firestore]);
  const { data: plans, isLoading: isLoadingPlans } = useCollection<any>(plansCollectionRef);


  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('');
  };
  
  const isLoading = isLoadingUsers || isLoadingAppointments || isLoadingAllAppointments || isLoadingPlans;

  const dashboardStats = useMemo(() => {
    if (isLoading || !users || !allAppointments || !plans) {
      return {
        totalRevenue: 0,
        totalAppointments: 0,
        totalUsers: 0,
        totalCancellations: 0,
      };
    }
    
    // Calculate total revenue from subscribed users
    const planMap = new Map(plans.map(p => [p.id, parseInt(p.price.replace('€', ''), 10)]));
    const totalRevenue = users.reduce((acc, user) => {
      if (user.planId && planMap.has(user.planId)) {
        return acc + (planMap.get(user.planId) ?? 0);
      }
      return acc;
    }, 0);

    const totalAppointments = allAppointments.length;
    const totalUsers = users.length;
    const totalCancellations = allAppointments.filter(app => app.status === 'Cancelado').length;

    return { totalRevenue, totalAppointments, totalUsers, totalCancellations };
  }, [isLoading, users, allAppointments, plans]);
  
  
  const populatedAppointments = useMemo(() => {
    if (isLoading || !recentAppointments || !users) return [];
    return recentAppointments.map(app => {
      const user = users.find(u => u.id === app.userId);
      return {
        ...app,
        userName: user?.displayName || 'Utilizador Desconhecido',
        userEmail: user?.email || '',
        userAvatar: user?.photoURL || '',
      };
    });
  }, [isLoading, recentAppointments, users]);


  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal (Subscrições)</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">€{dashboardStats.totalRevenue.toFixed(2)}</div>}
            <p className="text-xs text-muted-foreground">Receita baseada em subscrições ativas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{dashboardStats.totalAppointments}</div>}
             <p className="text-xs text-muted-foreground">Total de agendamentos registrados.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{dashboardStats.totalUsers}</div>}
             <p className="text-xs text-muted-foreground">Total de usuários cadastrados.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelamentos</CardTitle>
             <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{dashboardStats.totalCancellations}</div>}
            <p className="text-xs text-muted-foreground">Total de agendamentos cancelados.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral da Receita (Exemplo)</CardTitle>
             <CardDescription>Este gráfico ainda usa dados de exemplo.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Agendamentos Recentes</CardTitle>
            <CardDescription>Os 5 agendamentos mais recentes.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {populatedAppointments.length > 0 ? populatedAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                            <AvatarImage src={appointment.userAvatar} alt={appointment.userName} />
                            <AvatarFallback>{getInitials(appointment.userName)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-0.5">
                            <p className="font-medium">{appointment.userName}</p>
                            <p className="text-xs text-muted-foreground">{appointment.userEmail}</p>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>{appointment.serviceName}</TableCell>
                        <TableCell>
                        <Badge
                            variant={
                            appointment.status === 'Confirmado'
                                ? 'default'
                                : appointment.status === 'Concluído'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="capitalize"
                        >
                            {appointment.status}
                        </Badge>
                        </TableCell>
                    </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">Nenhum agendamento recente.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

    
