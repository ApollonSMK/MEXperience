'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isThisMonth, isThisYear, isPast, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, ConciergeBell, MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

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

const AppointmentCard = ({ appointment, onDeleteClick }: { appointment: PopulatedAppointment, onDeleteClick: () => void }) => {
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
                <div className="flex items-center gap-2">
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
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={onDeleteClick}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                </div>
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

const AppointmentList = ({ appointments, isLoading, onDeleteClick }: { appointments: PopulatedAppointment[], isLoading: boolean, onDeleteClick: (app: PopulatedAppointment) => void }) => {
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
                    <TableHead className="text-right">Ações</TableHead>
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
                        <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="text-destructive" onClick={() => onDeleteClick(app)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
    
    // Version for Mobile
    const MobileView = () => (
        <div className="space-y-4">
            {appointments.map(app => <AppointmentCard key={app.id} appointment={app} onDeleteClick={() => onDeleteClick(app)} />)}
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
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PopulatedAppointment | null>(null);

  const allAppointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appointments'), orderBy('date', 'desc'));
  }, [firestore]);
  const { data: appointments, isLoading: isLoadingAppointments, mutate } = useCollection<any>(allAppointmentsQuery);
  
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersCollectionRef);

  const isLoading = isLoadingAppointments || isLoadingUsers;

  const populatedAppointments = useMemo(() => {
    if (!appointments || !users) return [];
    return appointments.map((app: Appointment) => {
        const user = users.find(u => u.id === app.userId);
        return {
            ...app,
            userName: user?.displayName || 'Utilizador Desconhecido',
            userEmail: user?.email || 'N/A',
            userAvatar: user?.photoURL || '',
        }
    })
  }, [appointments, users]);

  const { today, week, month, year, past } = useMemo(() => {
    if (!populatedAppointments) return { today: [], week: [], month: [], year: [], past: [] };
    
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: ptBR, weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { locale: ptBR, weekStartsOn: 1 });

    const todayList = populatedAppointments.filter((app: any) => isToday(app.date.toDate()));
    const weekList = populatedAppointments.filter((app: any) => isWithinInterval(app.date.toDate(), { start: weekStart, end: weekEnd }));
    const monthList = populatedAppointments.filter((app: any) => isThisMonth(app.date.toDate()));
    const yearList = populatedAppointments.filter((app: any) => isThisYear(app.date.toDate()));
    const pastList = populatedAppointments.filter((app: any) => isPast(app.date.toDate()) && !isToday(app.date.toDate()));

    return { today: todayList, week: weekList, month: monthList, year: yearList, past: pastList };

  }, [populatedAppointments]);

  const handleOpenDeleteDialog = (appointment: PopulatedAppointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAppointment = async () => {
    if (!firestore || !selectedAppointment) return;
    try {
      const appointmentRef = doc(firestore, 'appointments', selectedAppointment.id);
      await deleteDocumentNonBlocking(appointmentRef);
      toast({
        title: "Agendamento Removido!",
        description: `O agendamento de ${selectedAppointment.serviceName} foi removido com sucesso.`,
      });
      mutate(); // Re-fetch the data
    } catch (e: any) {
      console.error("Error deleting appointment:", e);
      toast({
        variant: "destructive",
        title: "Erro ao remover agendamento",
        description: e.message || "Ocorreu um erro inesperado.",
      });
    }
    setIsDeleteDialogOpen(false);
    setSelectedAppointment(null);
  };


  return (
    <>
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
              <AppointmentList appointments={today} isLoading={isLoading} onDeleteClick={handleOpenDeleteDialog} />
            </TabsContent>
            <TabsContent value="week">
               <AppointmentList appointments={week} isLoading={isLoading} onDeleteClick={handleOpenDeleteDialog} />
            </TabsContent>
            <TabsContent value="month">
               <AppointmentList appointments={month} isLoading={isLoading} onDeleteClick={handleOpenDeleteDialog} />
            </TabsContent>
            <TabsContent value="year">
               <AppointmentList appointments={year} isLoading={isLoading} onDeleteClick={handleOpenDeleteDialog} />
            </TabsContent>
            <TabsContent value="past">
               <AppointmentList appointments={past} isLoading={isLoading} onDeleteClick={handleOpenDeleteDialog} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto irá remover permanentemente o agendamento de
              <span className="font-semibold"> {selectedAppointment?.serviceName} </span>
              para
              <span className="font-semibold"> {selectedAppointment?.userName} </span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
