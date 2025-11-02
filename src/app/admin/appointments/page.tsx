'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isSameDay, startOfWeek, endOfWeek, addDays, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, ConciergeBell, MoreHorizontal, Trash2, User, Info } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Interfaces
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

interface Schedule {
    id: string;
    dayName: string;
    timeSlots: string[];
    order: number;
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

// --- New AgendaView Component ---
const AgendaView = ({ days, timeSlots, appointments, onDeleteClick }: { days: Date[], timeSlots: string[], appointments: PopulatedAppointment[], onDeleteClick: (app: PopulatedAppointment) => void }) => {
    
    // Create a map for quick appointment lookup: 'YYYY-MM-DD-HH:mm' -> appointment
    const appointmentsMap = useMemo(() => {
        const map = new Map<string, PopulatedAppointment>();
        appointments.forEach(app => {
            const key = format(app.date.toDate(), 'yyyy-MM-dd-HH:mm');
            map.set(key, app);
        });
        return map;
    }, [appointments]);

    if (!days || days.length === 0) {
        return <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg mt-4">Nenhum dia para exibir.</div>;
    }

    if (!timeSlots || timeSlots.length === 0) {
        return <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg mt-4">Nenhum horário de funcionamento configurado.</div>;
    }
    
    return (
        <div className="border rounded-lg mt-4 overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="p-3 w-24 sticky left-0 bg-muted/50"><Clock className="h-5 w-5 mx-auto" /></th>
                        {days.map(day => (
                            <th key={day.toISOString()} className="p-3 text-center whitespace-nowrap">
                                <div className="font-semibold">{format(day, 'EEE', { locale: ptBR })}</div>
                                <div className="text-xs text-muted-foreground">{format(day, 'dd/MM')}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {timeSlots.map(time => (
                        <tr key={time} className="border-t">
                            <td className="p-2 font-mono text-center sticky left-0 bg-background">{time}</td>
                            {days.map(day => {
                                const key = `${format(day, 'yyyy-MM-dd')}-${time}`;
                                const appointment = appointmentsMap.get(key);
                                return (
                                    <td key={day.toISOString() + time} className="p-1 h-24 w-40 border-l align-top">
                                        {appointment ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Card className="h-full w-full bg-primary/10 text-xs overflow-hidden">
                                                            <CardContent className="p-2">
                                                                <p className="font-semibold truncate flex items-center gap-1.5"><User className="h-3 w-3 shrink-0" /> {appointment.userName}</p>
                                                                <p className="text-muted-foreground truncate flex items-center gap-1.5"><ConciergeBell className="h-3 w-3 shrink-0" /> {appointment.serviceName}</p>
                                                            </CardContent>
                                                        </Card>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p><strong>Cliente:</strong> {appointment.userName}</p>
                                                        <p><strong>Serviço:</strong> {appointment.serviceName}</p>
                                                        <p><strong>Status:</strong> {appointment.status}</p>
                                                        <p><strong>Hora:</strong> {format(appointment.date.toDate(), 'HH:mm')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : null}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// --- Main Page Component ---
export default function AdminAppointmentsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PopulatedAppointment | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());


  // Data fetching
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

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'schedules'), orderBy('order'));
  }, [firestore]);
  const { data: schedules, isLoading: isLoadingSchedules } = useCollection<Schedule>(schedulesQuery);


  const isLoading = isLoadingAppointments || isLoadingUsers || isLoadingSchedules;

  // Data processing
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

  const allTimeSlots = useMemo(() => {
    if (!schedules) return [];
    const slots = new Set<string>();
    schedules.forEach(day => {
        day.timeSlots.forEach(ts => slots.add(ts));
    })
    return Array.from(slots).sort();
  }, [schedules]);
  
  const appointmentsByDay = useMemo(() => {
      const map = new Map<string, PopulatedAppointment[]>();
      populatedAppointments.forEach(app => {
          const dayKey = format(app.date.toDate(), 'yyyy-MM-dd');
          if (!map.has(dayKey)) {
              map.set(dayKey, []);
          }
          map.get(dayKey)?.push(app);
      });
      return map;
  }, [populatedAppointments]);

  const { todayAppointments, weekAppointments, weekDays } = useMemo(() => {
    const today = new Date();
    const todayKey = format(today, 'yyyy-MM-dd');

    const start = startOfWeek(today, { locale: ptBR });
    const end = endOfWeek(today, { locale: ptBR });
    const weekDays = eachDayOfInterval({start, end});

    const weekAppointments = populatedAppointments.filter(app => {
        const appDate = app.date.toDate();
        return appDate >= start && appDate <= end;
    });

    return { 
        todayAppointments: appointmentsByDay.get(todayKey) || [],
        weekAppointments,
        weekDays,
    };
  }, [populatedAppointments, appointmentsByDay]);
  
  const appointmentsForSelectedDay = useMemo(() => {
      if (!selectedDay) return [];
      const key = format(selectedDay, 'yyyy-MM-dd');
      return appointmentsByDay.get(key) || [];
  }, [selectedDay, appointmentsByDay]);


  // Handlers
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
  
  const DayWithAppointments = ({ date, displayMonth }: { date: Date, displayMonth: Date }) => {
      const dayKey = format(date, 'yyyy-MM-dd');
      const hasAppointments = appointmentsByDay.has(dayKey);
      const isSelected = selectedDay && isSameDay(date, selectedDay);
      
      return (
          <div className="relative">
              {date.getDate()}
              {hasAppointments && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary" />}
          </div>
      )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Agendamentos</CardTitle>
          <CardDescription>Visualize e gerencie os agendamentos dos clientes numa vista de calendário.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="week">
            <TabsList className="h-auto flex-wrap justify-start">
              <TabsTrigger value="today">Hoje</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>

            {isLoading && (
                 <div className="mt-4 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            )}
            
            {!isLoading && (
              <>
                <TabsContent value="today">
                  <AgendaView 
                    days={[new Date()]} 
                    timeSlots={allTimeSlots} 
                    appointments={todayAppointments}
                    onDeleteClick={handleOpenDeleteDialog} 
                   />
                </TabsContent>
                <TabsContent value="week">
                   <AgendaView 
                    days={weekDays} 
                    timeSlots={allTimeSlots} 
                    appointments={weekAppointments}
                    onDeleteClick={handleOpenDeleteDialog} 
                   />
                </TabsContent>
                <TabsContent value="month" className="grid md:grid-cols-2 gap-6 mt-4">
                    <div>
                        <Calendar 
                            mode="single"
                            selected={selectedDay}
                            onSelect={setSelectedDay}
                            month={selectedMonth}
                            onMonthChange={setSelectedMonth}
                            className="rounded-md border w-full"
                            locale={ptBR}
                            components={{ Day: DayWithAppointments }}
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold">
                            Agendamentos para {selectedDay ? format(selectedDay, 'd MMMM, yyyy', { locale: ptBR }) : 'Nenhum dia selecionado'}
                        </h3>
                        {appointmentsForSelectedDay.length > 0 ? (
                            appointmentsForSelectedDay.map(app => (
                                <Card key={app.id}>
                                    <CardHeader className="flex flex-row justify-between items-start p-4">
                                        <div>
                                            <p className="font-semibold">{app.serviceName}</p>
                                            <p className="text-sm text-muted-foreground">{app.userName}</p>
                                            <p className="text-xs text-muted-foreground">{format(app.date.toDate(), 'HH:mm')}</p>
                                        </div>
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
                                    </CardHeader>
                                </Card>
                            ))
                        ) : (
                             <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                                <Info className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="mt-2">Nenhum agendamento para este dia.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
               </>
            )}
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
