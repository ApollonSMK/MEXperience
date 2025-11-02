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
import { Calendar, Clock, User, ConciergeBell } from 'lucide-react';

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

const AppointmentCard = ({ appointment }: { appointment: PopulatedAppointment }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
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
                 <Badge
                    variant={
                    appointment.status === 'Confirmado' ? 'default'
                    : appointment.status === 'Concluído' ? 'secondary'
                    : 'destructive'
                    }
                    className="capitalize"
                >
                    {appointment.status}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm pt-4">
                 <div className="flex items-center">
                    <ConciergeBell className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{appointment.serviceName}</span>
                </div>
                <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{format(appointment.date.toDate(), "d MMM yyyy", { locale: ptBR })}</span>
                </div>
                 <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{format(appointment.date.toDate(), "HH:mm", { locale: ptBR })}</span>
                </div>
            </CardContent>
        </Card>
    );
};

const AppointmentList = ({ appointments, isLoading }: { appointments: PopulatedAppointment[], isLoading: boolean }) => {
    if (isLoading) {
        return (
            <div className="space-y-4 mt-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
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

    // Version for Desktop
    const DesktopView = () => (
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
    );
    
    // Version for Mobile
    const MobileView = () => (
        <div className="space-y-4">
            {appointments.map(app => <AppointmentCard key={app.id} appointment={app} />)}
        </div>
    );

    return (
        <div className="mt-4">
            <div className="hidden md:block">
                <DesktopView />
            </div>
            <div className="block md:hidden">
                <MobileView />
            </div>
        </div>
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
    const weekStart = startOfWeek(now, { locale: ptBR, weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { locale: ptBR, weekStartsOn: 1 });

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
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="year">Ano</TabsTrigger>
            <TabsTrigger value="past">Passados</TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            <AppointmentList appointments={filteredAppointments.today || []} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="week">
             <AppointmentList appointments={filteredAppointments.week || []} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="month">
             <AppointmentList appointments={filteredAppointments.month || []} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="year">
             <AppointmentList appointments={filteredAppointments.year || []} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="past">
             <AppointmentList appointments={filteredAppointments.past || []} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
