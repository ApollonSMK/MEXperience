'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, collection, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isThisMonth, isThisYear, isPast, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  userId: string;
  serviceName: string;
  date: Timestamp;
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
}

interface User {
  id: string;
  displayName?: string;
  photoURL?: string;
  email: string;
}

interface PopulatedAppointment extends Appointment {
  userName: string;
  userEmail: string;
  userAvatar: string;
}

const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('');
};

const AppointmentTable = ({ appointments, isLoading }: { appointments: PopulatedAppointment[], isLoading: boolean }) => {
    if (isLoading) {
        return (
            <div className="space-y-2 mt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    if (appointments.length === 0) {
        return (
            <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg mt-4">
                <p>Nenhum agendamento para este período.</p>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data e Hora</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {appointments.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                <AvatarImage src={app.userAvatar} alt={app.userName} />
                                <AvatarFallback>{getInitials(app.userName)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5">
                                <p className="font-medium">{app.userName}</p>
                                <p className="text-xs text-muted-foreground">{app.userEmail}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>{app.serviceName}</TableCell>
                        <TableCell>{format(app.date.toDate(), "d MMM yyyy, HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell>
                            <Badge
                                variant={
                                app.status === 'Confirmado' ? 'default'
                                : app.status === 'Concluído' ? 'secondary'
                                : 'destructive'
                                }
                                className="capitalize"
                            >
                                {app.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default function AdminAppointmentsPage() {
  const firestore = useFirestore();

  const allAppointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'appointments'), orderBy('date', 'desc'));
  }, [firestore]);
  const { data: appointments, isLoading: isLoadingAppointments } = useCollection<Appointment>(allAppointmentsQuery);
  
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersCollectionRef);

  const isLoading = isLoadingAppointments || isLoadingUsers;

  const populatedAppointments = useMemo(() => {
    if (!appointments || !users) return [];
    return appointments.map((app) => {
        const user = users.find(u => u.id === app.userId);
        return {
            ...app,
            userName: user?.displayName || 'Utilizador Desconhecido',
            userEmail: user?.email || 'N/A',
            userAvatar: user?.photoURL || '',
        }
    })
  }, [appointments, users]);

  const filteredAppointments = useMemo(() => {
    if (!populatedAppointments) return {};
    
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const today = populatedAppointments.filter(app => isToday(app.date.toDate()));
    const week = populatedAppointments.filter(app => isWithinInterval(app.date.toDate(), { start: weekStart, end: weekEnd }));
    const month = populatedAppointments.filter(app => isThisMonth(app.date.toDate()));
    const year = populatedAppointments.filter(app => isThisYear(app.date.toDate()));
    const past = populatedAppointments.filter(app => isPast(app.date.toDate()) && !isToday(app.date.toDate()));

    return { today, week, month, year, past };

  }, [populatedAppointments]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Agendamentos</CardTitle>
        <CardDescription>Visualize e gerencie os agendamentos dos clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="year">Ano</TabsTrigger>
            <TabsTrigger value="past">Passados</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="mt-4">
            <AppointmentTable appointments={filteredAppointments.today || []} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="week" className="mt-4">
             <AppointmentTable appointments={filteredAppointments.week || []} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="month" className="mt-4">
             <AppointmentTable appointments={filteredAppointments.month || []} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="year" className="mt-4">
             <AppointmentTable appointments={filteredAppointments.year || []} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="past" className="mt-4">
             <AppointmentTable appointments={filteredAppointments.past || []} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
