'use client';

import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isSameDay, startOfWeek, endOfWeek, addDays, eachDayOfInterval, getDay, addMinutes, parse, differenceInMinutes, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, ConciergeBell, MoreHorizontal, Trash2, User, Info, PlusCircle, CreditCard, AlertTriangle, User as UserIcon, Wallet, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { AdminAppointmentForm, type AdminAppointmentFormValues } from '@/components/admin-appointment-form';
import type { Service } from '@/app/admin/services/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Interfaces
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

interface UserProfile {
  id: string;
  display_name?: string;
  photo_url?: string;
  email: string;
  plan_id?: string;
  minutes_balance?: number;
}

interface Plan {
    id: string;
    title: string;
}

interface Schedule {
    id: string;
    day_name: string;
    time_slots: string[];
    order: number;
}

interface NewAppointmentSlot {
    date: Date;
    time: string;
}

interface PaymentDetails {
    appointment: Appointment;
    price: number;
    user: UserProfile | null;
    userPlan: Plan | null;
}

const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('');
};

const CurrentTimeIndicator = ({ timeSlots, timeSlotInterval }: { timeSlots: string[], timeSlotInterval: number }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    if (timeSlots.length === 0) return null;

    const firstSlotDate = parse(timeSlots[0], 'HH:mm', new Date());
    const minutesFromStart = differenceInMinutes(currentTime, firstSlotDate);
    const rowHeight = 112; // h-28 = 7rem = 112px
    const topPosition = (minutesFromStart / timeSlotInterval) * rowHeight;
    
    const lastSlotDate = parse(timeSlots[timeSlots.length - 1], 'HH:mm', new Date());
    const endTimeWithInterval = addMinutes(lastSlotDate, timeSlotInterval);
    if (currentTime < firstSlotDate || currentTime > endTimeWithInterval) {
        return null;
    }

    return (
        <div 
            className="absolute z-30 w-full flex items-center pointer-events-none"
            style={{ top: `${topPosition}px` }}
        >
            <div className="h-2 w-2 rounded-full bg-red-500 sticky left-[92px]"></div>
            <div className="flex-grow h-[2px] bg-red-500"></div>
        </div>
    );
};


const AgendaView = ({ days, timeSlots, appointments, onDeleteClick, onSlotClick, onPayClick, services }: { days: Date[], timeSlots: string[], appointments: Appointment[], onDeleteClick: (app: Appointment) => void, onSlotClick: (slot: NewAppointmentSlot) => void, onPayClick: (app: Appointment) => void, services: Service[] }) => {
    
    const timeSlotInterval = useMemo(() => {
        if (timeSlots.length < 2) return 15;
        const sortedSlots = [...timeSlots].sort();
        const t1 = parse(sortedSlots[0], 'HH:mm', new Date());
        const t2 = parse(sortedSlots[1], 'HH:mm', new Date());
        const diff = differenceInMinutes(t2, t1);
        return diff > 0 ? diff : 15;
    }, [timeSlots]);

    const appointmentsMap = useMemo(() => {
        const map = new Map<string, Appointment[]>();
        appointments.forEach(app => {
            const startDate = new Date(app.date);
            const startHour = startDate.getHours();
            const startMinute = startDate.getMinutes();
            
            const closestSlot = timeSlots.reduce((prev, curr) => {
                const [prevHour, prevMinute] = prev.split(':').map(Number);
                const [currHour, currMinute] = curr.split(':').map(Number);
                const prevDiff = Math.abs((startHour * 60 + startMinute) - (prevHour * 60 + prevMinute));
                const currDiff = Math.abs((startHour * 60 + startMinute) - (currHour * 60 + currMinute));
                return currDiff < prevDiff ? curr : prev;
            });

            const key = format(startDate, `yyyy-MM-dd-${closestSlot}`);
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)!.push(app);
        });
        return map;
    }, [appointments, timeSlots]);
    
    const busyServicesMap = useMemo(() => {
        const map = new Map<string, Set<string>>();
        const PREP_TIME = 15;

        appointments.forEach(app => {
            const startDate = new Date(app.date);
            const totalBlockedTime = app.duration + PREP_TIME;
            const endDate = addMinutes(startDate, totalBlockedTime);
            
            timeSlots.forEach(time => {
                const slotDateWithDay = parse(time, 'HH:mm', startDate);
                if (slotDateWithDay >= startDate && slotDateWithDay < endDate) {
                     const key = format(startDate, `yyyy-MM-dd-${time}`);
                     if (!map.has(key)) {
                        map.set(key, new Set());
                     }
                     map.get(key)!.add(app.service_name);
                }
            });
        });
        return map;
    }, [appointments, timeSlots]);


    if (!days || days.length === 0) {
        return <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg mt-4">Nenhum dia para exibir.</div>;
    }

    if (!timeSlots || timeSlots.length === 0) {
        return <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg mt-4">Nenhum horário de funcionamento configurado.</div>;
    }
    
    const getCardBgColor = (appointment: Appointment) => {
        if (appointment.status === 'Concluído') {
            return '#16a34a'; // green-600
        }
        const service = services.find(s => s.name === appointment.service_name);
        return service?.color || '#a1a1aa';
    }

    const handleCardClick = (appointment: Appointment, e: React.MouseEvent) => {
        e.stopPropagation();
        onPayClick(appointment);
    }
    
    const showTimeIndicator = useMemo(() => days.some(day => isToday(day)), [days]);

    return (
        <div className="border rounded-lg mt-4 overflow-hidden">
            <div className="relative">
                <div className="overflow-x-auto sticky top-0 z-10 bg-primary">
                    <table className="w-full text-sm text-left">
                        <thead className="text-primary-foreground">
                            <tr>
                                <th className="p-3 w-24 sticky left-0 bg-primary"><Clock className="h-5 w-5 mx-auto" /></th>
                                {days.map(day => (
                                    <th key={day.toISOString()} className="p-3 text-center whitespace-nowrap min-w-[12rem]">
                                        <div className="font-semibold">{format(day, 'EEE', { locale: ptBR })}</div>
                                        <div className="text-xs text-primary-foreground/80">{format(day, 'dd/MM')}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    </table>
                </div>
                <div className="overflow-auto relative" style={{maxHeight: 'calc(100vh - 20rem)'}}>
                    {showTimeIndicator && <CurrentTimeIndicator timeSlots={timeSlots} timeSlotInterval={timeSlotInterval}/>}
                    <table className="w-full text-sm text-left border-separate" style={{ borderSpacing: 0 }}>
                        <tbody className='divide-y'>
                            {timeSlots.map(time => (
                                <tr key={time} className="divide-x">
                                    <td className="p-2 font-mono text-center sticky left-0 bg-background w-24 h-28">{time}</td>
                                    {days.map(day => {
                                        const dayKey = format(day, 'yyyy-MM-dd');
                                        const slotKey = `${dayKey}-${time}`;
                                        const slotAppointments = appointmentsMap.get(slotKey) || [];
                                        const busyServices = busyServicesMap.get(slotKey) || new Set();
                                        const isFull = busyServices.size >= services.length;

                                        return (
                                            <td key={day.toISOString() + time} className="p-0 align-top relative group w-48" onClick={() => !isFull && onSlotClick({date: day, time})}>
                                                <div className="h-28 w-full transition-colors cursor-pointer flex flex-col gap-1 overflow-hidden border-t"
                                                    style={{backgroundColor: isFull ? 'hsl(var(--destructive) / 0.1)' : 'transparent'}}
                                                >
                                                </div>
                                                <div className='absolute inset-0 p-1 flex gap-1 z-10 pointer-events-none'>
                                                    {slotAppointments.map(appointment => {
                                                        const heightMultiplier = appointment.duration / timeSlotInterval;
                                                        const cardHeight = `calc(${heightMultiplier * 100}% + ${heightMultiplier - 1}px)`;
                                                        
                                                        return (
                                                            <Card 
                                                                key={appointment.id}
                                                                className={`text-xs overflow-hidden cursor-pointer text-white pointer-events-auto`}
                                                                style={{ height: cardHeight, flex: `1 1 ${100 / services.length}%`, backgroundColor: getCardBgColor(appointment) }}
                                                                onClick={(e) => handleCardClick(appointment, e)}
                                                            >
                                                                <CardHeader className="p-1.5">
                                                                    <div>
                                                                        <p className="font-semibold truncate flex items-center gap-1"><UserIcon className="h-3 w-3 shrink-0" /> {appointment.user_name}</p>
                                                                        <p className="text-white/80 truncate flex items-center gap-1"><ConciergeBell className="h-3 w-3 shrink-0" /> {appointment.service_name}</p>
                                                                    </div>
                                                                </CardHeader>
                                                            </Card>
                                                        )
                                                    })}
                                                </div>
                                                {!isFull && (
                                                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                        <PlusCircle className="h-5 w-5 text-primary" />
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
        </div>
    )
}

export default function AdminAppointmentsPage() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<NewAppointmentSlot | null>(null);

  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: appointmentsData, error: appointmentsError },
        { data: usersData, error: usersError },
        { data: plansData, error: plansError },
        { data: schedulesData, error: schedulesError },
        { data: servicesData, error: servicesError },
      ] = await Promise.all([
        supabase.from('appointments').select('*').order('date', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('plans').select('*'),
        supabase.from('schedules').select('*').order('order', { ascending: true }),
        supabase.from('services').select('*').order('order', { ascending: true }),
      ]);

      if (appointmentsError) throw appointmentsError;
      if (usersError) throw usersError;
      if (plansError) throw plansError;
      if (schedulesError) throw schedulesError;
      if (servicesError) throw servicesError;

      setAppointments(appointmentsData as Appointment[] || []);
      setUsers(usersData as UserProfile[] || []);
      setPlans(plansData as Plan[] || []);
      setSchedules(schedulesData as Schedule[] || []);
      setServices(servicesData as Service[] || []);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  const allTimeSlots = useMemo(() => {
    if (!schedules) return [];
    const slots = new Set<string>();
    schedules.forEach(day => {
        day.time_slots.forEach(ts => slots.add(ts));
    })
    return Array.from(slots).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [schedules]);
  
  const appointmentsByDay = useMemo(() => {
      const map = new Map<string, Appointment[]>();
      appointments?.forEach(app => {
          const dayKey = format(new Date(app.date), 'yyyy-MM-dd');
          if (!map.has(dayKey)) {
              map.set(dayKey, []);
          }
          map.get(dayKey)?.push(app);
      });
      return map;
  }, [appointments]);

  const { todayAppointments, weekAppointments, weekDays } = useMemo(() => {
    const today = new Date();
    const todayKey = format(today, 'yyyy-MM-dd');

    const start = startOfWeek(today, { locale: ptBR });
    const end = endOfWeek(today, { locale: ptBR });
    const weekDays = eachDayOfInterval({start, end});

    const weekAppointments = appointments?.filter(app => {
        const appDate = new Date(app.date);
        return appDate >= start && appDate <= end;
    }) || [];

    return { 
        todayAppointments: appointmentsByDay.get(todayKey) || [],
        weekAppointments,
        weekDays,
    };
  }, [appointments, appointmentsByDay]);
  
  const appointmentsForSelectedDay = useMemo(() => {
      if (!selectedDay) return [];
      const key = format(selectedDay, 'yyyy-MM-dd');
      return appointmentsByDay.get(key) || [];
  }, [selectedDay, appointmentsByDay]);

  const handleOpenDeleteDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', selectedAppointment.id);
      if (error) throw error;
      toast({
        title: "Agendamento Removido!",
        description: `O agendamento de ${selectedAppointment.service_name} foi removido com sucesso.`,
      });
      fetchData();
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
    if (!newAppointmentSlot || !services || !users) return;

    const [hours, minutes] = newAppointmentSlot.time.split(':').map(Number);
    const appointmentDate = new Date(newAppointmentSlot.date);
    appointmentDate.setHours(hours, minutes);
    
    const service = services.find(s => s.id === values.serviceId);
    if (!service) {
        toast({ variant: 'destructive', title: 'Serviço não encontrado' });
        return;
    }
    
    const PREP_TIME = 15;
    const totalBlockedTime = values.duration + PREP_TIME;
    const appointmentEndDate = addMinutes(appointmentDate, totalBlockedTime);

    const { data: existingAppointments, error: fetchError } = await supabase
      .from('appointments')
      .select('id, date, duration, service_name')
      .eq('service_name', service.name);

    if (fetchError) {
      toast({ variant: "destructive", title: "Erro ao verificar conflitos", description: fetchError.message });
      return;
    }

    const hasConflict = existingAppointments.some(existingApp => {
      const existingAppStartDate = new Date(existingApp.date);
      const existingAppEndDate = addMinutes(existingAppStartDate, existingApp.duration + PREP_TIME);
      return appointmentDate < existingAppEndDate && appointmentEndDate > existingAppStartDate;
    });

    if (hasConflict) {
        setIsConflictDialogOpen(true);
        return;
    }

    let userId = values.userId;
    let userName = '';
    let userEmail = '';

    if (userId === 'new-guest') {
        if (!values.guestName || !values.guestEmail) {
            toast({ variant: 'destructive', title: 'Dados do Convidado em Falta', description: "Nome e Email são obrigatórios." });
            return;
        }

        const newGuestUserData = {
            email: values.guestEmail,
            display_name: values.guestName,
            first_name: values.guestName.split(' ')[0] || '',
            last_name: values.guestName.split(' ').slice(1).join(' ') || '',
            phone: values.guestPhone || '',
            is_admin: false,
            minutes_balance: 0,
        };
        
        const { data: newProfile, error: insertError } = await supabase.from('profiles').insert(newGuestUserData).select().single();

        if (insertError || !newProfile) {
             toast({ variant: "destructive", title: "Erro ao criar convidado", description: insertError?.message });
             return;
        }
        
        userId = newProfile.id;
        userName = newProfile.display_name;
        userEmail = newProfile.email;
        fetchData();
    } else {
        const existingUser = users.find(u => u.id === userId);
        if (!existingUser) {
             toast({ variant: "destructive", title: "Utilizador não encontrado", description: "O cliente selecionado não é válido." });
             return;
        }
        userName = existingUser.display_name || '';
        userEmail = existingUser.email;
    }
    
    const dataToSave = {
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        service_name: service.name,
        date: appointmentDate.toISOString(),
        duration: values.duration,
        status: 'Confirmado' as 'Confirmado' | 'Concluído' | 'Cancelado',
        payment_method: values.paymentMethod,
    };

    try {
        const { error: insertAppError } = await supabase.from('appointments').insert(dataToSave);
        if (insertAppError) throw insertAppError;

        toast({
            title: "Agendamento Criado!",
            description: "O novo agendamento foi adicionado com sucesso.",
        });
        setIsFormDialogOpen(false);
        setNewAppointmentSlot(null);
        fetchData();
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Erro ao criar agendamento",
            description: e.message || "Ocorreu um erro inesperado.",
        });
    }
  };

  const handleOpenPaymentSheet = (appointment: Appointment) => {
    if (!services || !users || !plans) return;
    const service = services.find(s => s.name === appointment.service_name);
    const tier = service?.pricing_tiers.find(t => t.duration === appointment.duration);
    
    if (tier) {
        const user = users.find(u => u.id === appointment.user_id) || null;
        const userPlan = user && user.plan_id ? plans.find(p => p.id === user.plan_id) : null;
        setPaymentDetails({ appointment, price: tier.price, user, userPlan: userPlan || null });
        setAmountPaid('');
        setIsPaymentSheetOpen(true);
    } else {
        toast({
            variant: "destructive",
            title: "Preço não encontrado",
            description: "Não foi possível encontrar o preço para este serviço e duração.",
        });
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentDetails) return;

    try {
        const { error } = await supabase.from('appointments').update({ status: 'Concluído' }).eq('id', paymentDetails.appointment.id);
        if (error) throw error;
        toast({ title: 'Pagamento Processado!', description: 'O agendamento foi marcado como concluído.' });
        fetchData();
    } catch (e: any) {
        toast({ variant: "destructive", title: "Erro ao processar pagamento", description: e.message });
    } finally {
        setIsPaymentSheetOpen(false);
        setPaymentDetails(null);
    }
  };

  const calculateChange = () => {
    if (!paymentDetails || !amountPaid) return 0;
    const paid = parseFloat(amountPaid);
    if (isNaN(paid)) return 0;
    return paid - paymentDetails.price;
  }

  const handleDeleteFromPaymentSheet = () => {
    if (!paymentDetails) return;
    setIsPaymentSheetOpen(false);
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
  
  if (!isMounted) {
    return null;
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
            
            {!isLoading && services && (
              <>
                <TabsContent value="today">
                  <AgendaView 
                    days={[new Date()]} 
                    timeSlots={allTimeSlots} 
                    appointments={todayAppointments}
                    onDeleteClick={handleOpenDeleteDialog}
                    onSlotClick={handleSlotClick}
                    onPayClick={handleOpenPaymentSheet}
                    services={services}
                   />
                </TabsContent>
                <TabsContent value="week">
                   <AgendaView 
                    days={weekDays} 
                    timeSlots={allTimeSlots} 
                    appointments={weekAppointments}
                    onDeleteClick={handleOpenDeleteDialog}
                    onSlotClick={handleSlotClick}
                    onPayClick={handleOpenPaymentSheet}
                    services={services}
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
                                            <p className="font-semibold">{app.service_name}</p>
                                            <p className="text-sm text-muted-foreground">{app.user_name}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(app.date), 'HH:mm')}</p>
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
              <span className="font-semibold"> {selectedAppointment?.service_name} </span>
              para
              <span className="font-semibold"> {selectedAppointment?.user_name} </span>.
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
      
      <AlertDialog open={isConflictDialogOpen} onOpenChange={setIsConflictDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive"/> Horário em Conflito
            </AlertDialogTitle>
            <AlertDialogDescription>
                Já existe um agendamento para este serviço que se sobrepõe ao horário selecionado. Por favor, escolha um horário diferente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsConflictDialogOpen(false)}>Percebi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
         <SheetContent className="flex flex-col">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Processar Pagamento</SheetTitle>
            {paymentDetails && (
                <SheetDescription>
                   A processar pagamento para {paymentDetails.appointment.service_name}.
                </SheetDescription>
            )}
          </SheetHeader>
          {paymentDetails && (
            <div className="space-y-6 flex-grow overflow-y-auto px-6 py-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback>{getInitials(paymentDetails.user?.display_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{paymentDetails.user?.display_name}</p>
                            <p className="text-sm text-muted-foreground">{paymentDetails.user?.email}</p>
                        </div>
                    </CardContent>
                    <Separator />
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-primary" />
                            <div>
                                <p className="text-muted-foreground">Plano</p>
                                <p className="font-medium">{paymentDetails.userPlan?.title || 'Nenhum'}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-primary" />
                            <div>
                                <p className="text-muted-foreground">Minutos</p>
                                <p className="font-medium">{paymentDetails.user?.minutes_balance ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="text-center p-6 bg-slate-100 dark:bg-slate-800 rounded-lg">
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
           <SheetFooter className="px-6 py-4 border-t mt-auto">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between w-full gap-2">
                    <Button variant="destructive" onClick={handleDeleteFromPaymentSheet}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover Agend.
                    </Button>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsPaymentSheetOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmPayment} disabled={calculateChange() < 0}>Confirmar Pagamento</Button>
                    </div>
                </div>
           </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
