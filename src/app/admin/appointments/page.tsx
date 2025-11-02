'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isSameDay, startOfWeek, endOfWeek, addDays, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, ConciergeBell, MoreHorizontal, Trash2, User, Info, PlusCircle, CreditCard } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AdminAppointmentForm, type AdminAppointmentFormValues } from '@/components/admin-appointment-form';
import type { Service } from '@/app/admin/services/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Interfaces
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

interface NewAppointmentSlot {
    date: Date;
    time: string;
}

interface PaymentDetails {
    appointment: PopulatedAppointment;
    price: number;
}

const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('');
};

const AgendaView = ({ days, timeSlots, appointments, onDeleteClick, onSlotClick, onPayClick }: { days: Date[], timeSlots: string[], appointments: PopulatedAppointment[], onDeleteClick: (app: PopulatedAppointment) => void, onSlotClick: (slot: NewAppointmentSlot) => void, onPayClick: (app: PopulatedAppointment) => void }) => {
    
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
    
    const getCardBgColor = (status: Appointment['status']) => {
        switch (status) {
            case 'Confirmado': return 'bg-blue-100/60 dark:bg-blue-900/30';
            case 'Concluído': return 'bg-green-100/60 dark:bg-green-900/30';
            case 'Cancelado': return 'bg-red-100/60 dark:bg-red-900/30';
            default: return 'bg-background';
        }
    }

    const handleCardClick = (appointment: PopulatedAppointment) => {
        if (appointment.status === 'Confirmado') {
            onPayClick(appointment);
        } else {
            onDeleteClick(appointment);
        }
    }

    return (
        <div className="border rounded-lg mt-4 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-primary text-primary-foreground sticky top-0 z-10">
                        <tr>
                            <th className="p-3 w-24 sticky left-0 bg-primary"><Clock className="h-5 w-5 mx-auto" /></th>
                            {days.map(day => (
                                <th key={day.toISOString()} className="p-3 text-center whitespace-nowrap">
                                    <div className="font-semibold">{format(day, 'EEE', { locale: ptBR })}</div>
                                    <div className="text-xs text-primary-foreground/80">{format(day, 'dd/MM')}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                </table>
            </div>
            <div className="overflow-auto" style={{maxHeight: 'calc(100vh - 20rem)'}}>
                <table className="w-full text-sm text-left">
                    <tbody className='divide-y'>
                        {timeSlots.map(time => (
                            <tr key={time} className="divide-x">
                                <td className="p-2 font-mono text-center sticky left-0 bg-background w-24">{time}</td>
                                {days.map(day => {
                                    const key = `${format(day, 'yyyy-MM-dd')}-${time}`;
                                    const appointment = appointmentsMap.get(key);
                                    return (
                                        <td key={day.toISOString() + time} className="p-1 h-24 w-48 align-top relative group">
                                            {appointment ? (
                                                <Card 
                                                    className={`h-full w-full text-xs overflow-hidden cursor-pointer ${getCardBgColor(appointment.status)}`}
                                                    onClick={() => handleCardClick(appointment)}
                                                >
                                                    <CardHeader className="p-2">
                                                        <div>
                                                            <p className="font-semibold truncate flex items-center gap-1.5"><User className="h-3 w-3 shrink-0" /> {appointment.userName}</p>
                                                            <p className="text-muted-foreground truncate flex items-center gap-1.5"><ConciergeBell className="h-3 w-3 shrink-0" /> {appointment.serviceName}</p>
                                                        </div>
                                                    </CardHeader>
                                                </Card>
                                            ) : (
                                                <div onClick={() => onSlotClick({date: day, time})} className="h-full w-full rounded-md hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-center">
                                                    <PlusCircle className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-50 transition-opacity" />
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default function AdminAppointmentsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PopulatedAppointment | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<NewAppointmentSlot | null>(null);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');


  const allAppointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appointments'), orderBy('date', 'desc'));
  }, [firestore]);
  const { data: appointments, isLoading: isLoadingAppointments, mutate } = useCollection<any>(allAppointmentsQuery);
  
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users, isLoading: isLoadingUsers, mutate: mutateUsers } = useCollection<User>(usersCollectionRef);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'schedules'), orderBy('order'));
  }, [firestore]);
  const { data: schedules, isLoading: isLoadingSchedules } = useCollection<Schedule>(schedulesQuery);
  
  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'services'), orderBy('order'));
  }, [firestore]);
  const { data: services, isLoading: isLoadingServices } = useCollection<Service>(servicesQuery);

  const isLoading = isLoadingAppointments || isLoadingUsers || isLoadingSchedules || isLoadingServices;

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
      mutate();
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

  const handleSlotClick = (slot: NewAppointmentSlot) => {
    setNewAppointmentSlot(slot);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async (values: AdminAppointmentFormValues) => {
    if (!firestore || !newAppointmentSlot || !services) return;

    let userId = values.userId;

    // Handle guest user creation
    if (userId === 'new-guest') {
        if (!values.guestName || !values.guestEmail) {
            toast({ variant: 'destructive', title: 'Dados do Convidado em Falta', description: "Nome e Email são obrigatórios." });
            return;
        }

        const newUserRef = doc(collection(firestore, 'users'));
        const newGuestUserData = {
            id: newUserRef.id,
            email: values.guestEmail,
            displayName: values.guestName,
            firstName: values.guestName.split(' ')[0] || '',
            lastName: values.guestName.split(' ').slice(1).join(' ') || '',
            phone: values.guestPhone || '',
            creationTime: null, // Guests don't have a creation time
            isAdmin: false,
            minutesBalance: 0,
        };
        
        try {
            await setDocumentNonBlocking(newUserRef, newGuestUserData, {});
            userId = newUserRef.id;
            mutateUsers(); // Re-fetch users to include the new guest
        } catch (e: any) {
             toast({ variant: "destructive", title: "Erro ao criar convidado", description: e.message });
             return;
        }
    }
    
    const service = services.find(s => s.id === values.serviceId);
    if (!service) {
        toast({ variant: 'destructive', title: 'Serviço não encontrado' });
        return;
    }

    const [hours, minutes] = newAppointmentSlot.time.split(':').map(Number);
    const appointmentDate = new Date(newAppointmentSlot.date);
    appointmentDate.setHours(hours, minutes);

    const dataToSave = {
        userId: userId,
        serviceName: service.name,
        date: Timestamp.fromDate(appointmentDate),
        duration: values.duration,
        status: 'Confirmado' as 'Confirmado' | 'Concluído' | 'Cancelado',
        paymentMethod: values.paymentMethod,
    };

    try {
        await addDocumentNonBlocking(collection(firestore, 'appointments'), dataToSave);
        toast({
            title: "Agendamento Criado!",
            description: "O novo agendamento foi adicionado com sucesso.",
        });
        setIsFormDialogOpen(false);
        setNewAppointmentSlot(null);
        mutate();
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Erro ao criar agendamento",
            description: e.message || "Ocorreu um erro inesperado.",
        });
    }
  };

  const handleOpenPaymentDialog = (appointment: PopulatedAppointment) => {
    if (!services) return;
    const service = services.find(s => s.name === appointment.serviceName);
    const tier = service?.pricingTiers.find(t => t.duration === appointment.duration);
    
    if (tier) {
        setPaymentDetails({ appointment, price: tier.price });
        setAmountPaid('');
        setIsPaymentDialogOpen(true);
    } else {
        toast({
            variant: "destructive",
            title: "Preço não encontrado",
            description: "Não foi possível encontrar o preço para este serviço e duração.",
        });
    }
  };

  const handleConfirmPayment = async () => {
    if (!firestore || !paymentDetails) return;

    try {
        const appointmentRef = doc(firestore, 'appointments', paymentDetails.appointment.id);
        await setDocumentNonBlocking(appointmentRef, { status: 'Concluído' }, { merge: true });
        toast({ title: 'Pagamento Processado!', description: 'O agendamento foi marcado como concluído.' });
        mutate();
    } catch (e: any) {
        toast({ variant: "destructive", title: "Erro ao processar pagamento", description: e.message });
    } finally {
        setIsPaymentDialogOpen(false);
        setPaymentDetails(null);
    }
  };

  const calculateChange = () => {
    if (!paymentDetails || !amountPaid) return 0;
    const paid = parseFloat(amountPaid);
    if (isNaN(paid)) return 0;
    return paid - paymentDetails.price;
  }

  const handleDeleteFromPaymentDialog = () => {
    if (!paymentDetails) return;
    setIsPaymentDialogOpen(false);
    // Give time for the payment dialog to close before opening the delete dialog
    setTimeout(() => {
        handleOpenDeleteDialog(paymentDetails.appointment);
    }, 150);
  };
  
  const DayWithAppointments = ({ date }: { date: Date }) => {
      const dayKey = format(date, 'yyyy-MM-dd');
      const hasAppointments = appointmentsByDay.has(dayKey);
      
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
                    onSlotClick={handleSlotClick}
                    onPayClick={handleOpenPaymentDialog}
                   />
                </TabsContent>
                <TabsContent value="week">
                   <AgendaView 
                    days={weekDays} 
                    timeSlots={allTimeSlots} 
                    appointments={weekAppointments}
                    onDeleteClick={handleOpenDeleteDialog}
                    onSlotClick={handleSlotClick}
                    onPayClick={handleOpenPaymentDialog}
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

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            {newAppointmentSlot && (
                <DialogDescription>
                    A agendar para {format(newAppointmentSlot.date, 'd MMMM, yyyy', {locale: ptBR})} às {newAppointmentSlot.time}.
                </DialogDescription>
            )}
          </DialogHeader>
          <AdminAppointmentForm
            users={users || []}
            services={services || []}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
         <DialogContent className="flex flex-col">
          <DialogHeader>
            <DialogTitle>Processar Pagamento</DialogTitle>
            {paymentDetails && (
                <DialogDescription>
                   A processar pagamento para {paymentDetails.appointment.userName} - {paymentDetails.appointment.serviceName}.
                </DialogDescription>
            )}
          </DialogHeader>
          {paymentDetails && (
            <div className="space-y-6 flex-grow overflow-y-auto pr-2">
                <div className="text-center p-6 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor a Pagar</p>
                    <p className="text-4xl font-bold">€{paymentDetails.price.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount-paid">Valor Recebido (€)</Label>
                    <Input 
                        id="amount-paid"
                        type="number"
                        placeholder="Ex: 50.00"
                        value={amountPaid}
                        onChange={e => setAmountPaid(e.target.value)}
                    />
                </div>
                 {calculateChange() >= 0 && amountPaid !== '' && (
                    <div className="text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300">Troco</p>
                        <p className="text-2xl font-bold text-green-800 dark:text-green-200">€{calculateChange().toFixed(2)}</p>
                    </div>
                )}
            </div>
          )}
           <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t mt-auto">
                <Button variant="destructive" onClick={handleDeleteFromPaymentDialog}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                </Button>
                <div className="flex-grow sm:flex-grow-0" />
                <Button variant="ghost" onClick={() => setIsPaymentDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleConfirmPayment} disabled={calculateChange() < 0}>Confirmar</Button>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

    