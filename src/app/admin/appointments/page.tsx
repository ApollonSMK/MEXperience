'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isSameDay, startOfWeek, endOfWeek, addDays, eachDayOfInterval, getDay, addMinutes, parse, differenceInMinutes, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, ConciergeBell, MoreHorizontal, Trash2, User, Info, PlusCircle, CreditCard, AlertTriangle, User as UserIcon, Wallet, Star, CheckCircle, XCircle, DollarSign, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { AdminAppointmentForm, type AdminAppointmentFormValues } from '@/components/admin-appointment-form';
import type { Service } from '@/app/admin/services/page';
import { Input } from '@/components/ui/input';
import { AdminAppointmentsTable } from '@/components/admin-appointments-table';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
  payment_method: 'card' | 'minutes' | 'reception' | 'online';
}

interface UserProfile {
  id: string;
  display_name?: string | null;
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

const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('');
};

const CurrentTimeIndicator = ({ timeSlots, timeSlotInterval, days }: { timeSlots: string[], timeSlotInterval: number, days: Date[] }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const todayIndex = useMemo(() => days.findIndex(day => isToday(day)), [days]);

    if (timeSlots.length === 0 || todayIndex === -1) return null;

    const firstSlotDate = parse(timeSlots[0], 'HH:mm', new Date());
    const minutesFromStart = differenceInMinutes(currentTime, firstSlotDate);
    const rowHeight = 80; // h-20 = 5rem = 80px
    const topPosition = (minutesFromStart / timeSlotInterval) * rowHeight;
    
    const lastSlotDate = parse(timeSlots[timeSlots.length - 1], 'HH:mm', new Date());
    const endTimeWithInterval = addMinutes(lastSlotDate, timeSlotInterval);
    if (currentTime < firstSlotDate || currentTime > endTimeWithInterval) {
        return null;
    }
    
    // Position the indicator in the correct day column
    const leftPosition = `calc(5rem + ${todayIndex} * (100% - 5rem) / ${days.length})`;
    const width = `calc((100% - 5rem) / ${days.length})`;

    return (
        <div 
            className="absolute z-30 flex items-center pointer-events-none"
            style={{ top: `${topPosition}px`, left: leftPosition, width: width }}
        >
            <div className="h-2 w-2 rounded-full bg-red-500 -ml-1"></div>
            <div className="flex-grow h-[2px] bg-red-500"></div>
        </div>
    );
};

const AgendaView = ({ days, timeSlots, appointments, onSlotClick, onPayClick, services }: { days: Date[], timeSlots: string[], appointments: Appointment[], onSlotClick: (slot: NewAppointmentSlot) => void, onPayClick: (app: Appointment) => void, services: Service[] }) => {
    
    // Configuration de la grille
    const minTime = timeSlots.length > 0 ? parseInt(timeSlots[0].split(':')[0]) : 8;
    const maxTime = timeSlots.length > 0 ? parseInt(timeSlots[timeSlots.length-1].split(':')[0]) + 1 : 20;
    const START_HOUR = Math.max(0, minTime - 1);
    const END_HOUR = Math.min(24, maxTime + 1);
    const PIXELS_PER_HOUR = 160;
    const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
    const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

    // Heure actuelle pour la ligne rouge
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const getCurrentTimeOffset = () => {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = START_HOUR * 60;
        return (currentMinutes - startMinutes) * PIXELS_PER_MINUTE;
    };

    // Algorithme de mise en page des événements (gestion des chevauchements)
    const layoutEvents = (dayAppointments: Appointment[]) => {
        if (!dayAppointments.length) return [];
        
        // Trier par heure de début puis durée
        const sorted = [...dayAppointments].sort((a, b) => {
            const startA = new Date(a.date).getTime();
            const startB = new Date(b.date).getTime();
            return startA - startB || b.duration - a.duration;
        });

        const nodes = sorted.map(app => ({
            ...app,
            start: new Date(app.date).getTime(),
            end: new Date(app.date).getTime() + app.duration * 60000,
            colIndex: 0
        }));

        const columns: typeof nodes[] = [];
        
        // Packer les événements dans des colonnes virtuelles
        nodes.forEach(node => {
            let i = 0;
            while (true) {
                if (!columns[i]) {
                    columns[i] = [node];
                    node.colIndex = i;
                    break;
                }
                const collision = columns[i].some(other => node.start < other.end);
                if (!collision) {
                    columns[i].push(node);
                    node.colIndex = i;
                    break;
                }
                i++;
            }
        });

        // Calculer la largeur et la position
        return nodes.map(node => {
             const concurrent = nodes.filter(other => 
                 node.start < other.end && node.end > other.start
             );
             const maxColIndex = Math.max(...concurrent.map(n => n.colIndex));
             const totalCols = maxColIndex + 1;
             
             return {
                 data: node,
                 style: {
                     left: `${(node.colIndex / totalCols) * 100}%`,
                     width: `calc(${100 / totalCols}% - 12px)`, // Laisse 12px d'espace pour cliquer à côté
                     top: `${((new Date(node.date).getHours() * 60 + new Date(node.date).getMinutes()) - (START_HOUR * 60)) * PIXELS_PER_MINUTE}px`,
                     height: `${node.duration * PIXELS_PER_MINUTE}px`
                 }
             };
        });
    }

    const handleGridClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const minutesFromStart = y / PIXELS_PER_MINUTE;
        const totalMinutes = minutesFromStart + (START_HOUR * 60);
        const hour = Math.floor(totalMinutes / 60);
        const minute = Math.floor((totalMinutes % 60) / 15) * 15;
        
        const timeStr = `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
        onSlotClick({ date: day, time: timeStr });
    };

    const getServiceColor = (name: string) => {
         const service = services.find(s => s.name === name);
         return service?.color || '#3b82f6';
    }

    if (!days.length) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-220px)] border rounded-lg overflow-hidden bg-background">
            {/* En-tête des jours */}
            <div className="flex flex-none border-b bg-muted/20">
                <div className="w-16 flex-none border-r bg-background/50" />
                {days.map(day => (
                    <div key={day.toISOString()} className={cn("flex-1 py-3 text-center border-r last:border-r-0 font-medium", isToday(day) && "text-primary bg-primary/5")}>
                         <div className="text-sm opacity-80 uppercase">{format(day, 'EEE', { locale: fr })}</div>
                         <div className={cn("text-lg leading-none mt-1 h-8 w-8 mx-auto flex items-center justify-center rounded-full", isToday(day) && "bg-primary text-primary-foreground")}>
                             {format(day, 'd')}
                         </div>
                    </div>
                ))}
            </div>

            {/* Grille Scrollable */}
            <ScrollArea className="flex-1">
                <div className="flex relative min-h-0" style={{ height: (END_HOUR - START_HOUR) * PIXELS_PER_HOUR }}>
                    {/* Colonne des heures */}
                    <div className="w-16 flex-none border-r bg-background z-10 sticky left-0 text-xs text-muted-foreground text-right pr-2 select-none">
                        {hours.map(h => (
                            <div key={h} className="relative border-b border-border/40" style={{ height: PIXELS_PER_HOUR }}>
                                {/* Hora cheia */}
                                <span className="absolute -top-2.5 right-2 bg-background px-1 font-semibold text-foreground/80 z-10">{h}:00</span>
                                
                                {/* 15 min */}
                                <span className="absolute top-[25%] -translate-y-1/2 right-2 text-[10px] text-muted-foreground/60">{h}:15</span>
                                
                                {/* 30 min */}
                                <span className="absolute top-[50%] -translate-y-1/2 right-2 text-[10px] text-muted-foreground/60">{h}:30</span>
                                
                                {/* 45 min */}
                                <span className="absolute top-[75%] -translate-y-1/2 right-2 text-[10px] text-muted-foreground/60">{h}:45</span>
                            </div>
                        ))}
                    </div>

                    {/* Colonnes des jours */}
                    {days.map(day => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayEvents = appointments.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === dayKey);
                        const layoutedEvents = layoutEvents(dayEvents);

                        return (
                            <div 
                                key={day.toISOString()} 
                                className="flex-1 relative border-r last:border-r-0 hover:bg-muted/5 transition-colors"
                                onClick={(e) => handleGridClick(e, day)}
                            >
                                {/* Lignes de la grille */}
                                {hours.map(h => (
                                    <div key={h} className="absolute w-full pointer-events-none select-none border-b border-border/40" style={{ top: (h - START_HOUR) * PIXELS_PER_HOUR, height: PIXELS_PER_HOUR }}>
                                         {/* 15 min */}
                                         <div className="absolute top-[25%] w-full border-b border-dotted border-border/20" />
                                         {/* 30 min */}
                                         <div className="absolute top-[50%] w-full border-b border-dashed border-border/30" />
                                         {/* 45 min */}
                                         <div className="absolute top-[75%] w-full border-b border-dotted border-border/20" />
                                    </div>
                                ))}

                                {/* Indicateur "Maintenant" */}
                                {isToday(day) && (
                                    <div 
                                        className="absolute w-full border-t-2 border-red-500 z-30 pointer-events-none flex items-center"
                                        style={{ top: getCurrentTimeOffset() }}
                                    >
                                        <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 -mt-[1px]" />
                                    </div>
                                )}

                                {/* Rendez-vous */}
                                {layoutedEvents.map(({ data: app, style }) => {
                                    const color = getServiceColor(app.service_name);
                                    const isPaid = app.status === 'Concluído' || app.payment_method === 'card' || app.payment_method === 'minutes';

                                    return (
                                        <div
                                            key={app.id}
                                            onClick={(e) => { e.stopPropagation(); onPayClick(app); }}
                                            className="absolute p-1 rounded-md text-xs font-medium border-l-4 cursor-pointer hover:brightness-95 transition-all shadow-sm z-20 overflow-hidden"
                                            style={{
                                                ...style,
                                                backgroundColor: `${color}20`,
                                                borderLeftColor: color,
                                                color: '#1e293b' // text-slate-800
                                            }}
                                        >
                                            <div className="flex flex-col h-full gap-0.5">
                                                <div className="flex items-center justify-between gap-1 w-full">
                                                     <span className="truncate font-bold text-[10px] md:text-xs" style={{ color }}>
                                                        {format(new Date(app.date), 'HH:mm')} - {format(addMinutes(new Date(app.date), app.duration), 'HH:mm')}
                                                     </span>
                                                     {isPaid && <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />}
                                                </div>
                                                <div className="truncate font-semibold leading-tight">
                                                    {app.service_name}
                                                </div>
                                                <div className="truncate text-foreground/70 text-[10px] flex items-center gap-1">
                                                    <UserIcon className="h-3 w-3" />
                                                    {app.user_name}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}

export default function AdminAppointmentsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
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
  
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<NewAppointmentSlot | null>(null);

  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  
  const fetchInitialData = useCallback(async () => {
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
      toast({ variant: 'destructive', title: 'Erreur lors du chargement des données', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast, supabase]);


  useEffect(() => {
    setIsMounted(true);
    fetchInitialData();

    const appointmentChannel = supabase
      .channel('realtime:public:appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Realtime appointment change:', payload);
          if (payload.eventType === 'INSERT') {
            setAppointments(prev => {
                if (prev.find(a => a.id === payload.new.id)) return prev;
                return [payload.new as Appointment, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setAppointments(prev => prev.map(app => app.id === payload.new.id ? payload.new as Appointment : app));
          } else if (payload.eventType === 'DELETE') {
            setAppointments(prev => prev.filter(app => app.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentChannel);
    };
  }, [fetchInitialData, supabase]);


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
    
    const start = startOfWeek(today, { locale: fr });
    const end = endOfWeek(today, { locale: fr });
    const weekDays = eachDayOfInterval({start, end});

    const todayAppointments = appointments?.filter(app => isToday(new Date(app.date))) || [];

    const weekAppointments = appointments?.filter(app => {
        const appDate = new Date(app.date);
        return appDate >= start && appDate <= end;
    }) || [];

    return { 
        todayAppointments,
        weekAppointments,
        weekDays,
    };
  }, [appointments]);
  
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
      
      // Mise à jour locale immédiate
      setAppointments(prev => prev.filter(a => a.id !== selectedAppointment.id));

      toast({
        title: "Rendez-vous Supprimé !",
        description: `Le rendez-vous pour ${selectedAppointment.service_name} a été supprimé avec succès.`,
      });
      // Realtime will handle the UI update
    } catch (e: any) {
      console.error("Error deleting appointment:", e);
      toast({
        variant: "destructive",
        title: "Erreur lors de la suppression du rendez-vous",
        description: e.message || "Une erreur inattendue est survenue.",
      });
    }
    setIsDeleteDialogOpen(false);
    setSelectedAppointment(null);
  };

  const handleSlotClick = (slot: NewAppointmentSlot) => {
    setNewAppointmentSlot(slot);
    setIsFormSheetOpen(true);
  };

  const handleManualNewAppointment = () => {
    // Set a default slot for "now" rounded to next 15 min if manual button clicked
    const now = new Date();
    const minutes = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(minutes, 0, 0);
    
    setNewAppointmentSlot({
        date: now,
        time: format(now, 'HH:mm')
    });
    setIsFormSheetOpen(true);
  };

  const handleFormSubmit = async (values: AdminAppointmentFormValues) => {
    if (!newAppointmentSlot || !services || !users) return;
  
    const [hours, minutes] = newAppointmentSlot.time.split(':').map(Number);
    const appointmentDate = new Date(newAppointmentSlot.date);
    appointmentDate.setHours(hours, minutes);
    
    const service = services.find(s => s.id === values.serviceId);
    if (!service) {
        toast({ variant: 'destructive', title: 'Service non trouvé' });
        return;
    }
    
    const PREP_TIME = 15;
    const totalBlockedTime = values.duration + PREP_TIME;
    const appointmentEndDate = addMinutes(appointmentDate, totalBlockedTime);
  
    const { data: existingAppointments, error: fetchError } = await supabase
      .from('appointments')
      .select('id, date, duration, service_name')
      .eq('service_name', service.name); // Check for conflicts only within the same service
  
    if (fetchError) {
      toast({ variant: "destructive", title: "Erreur lors de la vérification des conflits", description: fetchError.message });
      return;
    }
  
    const hasConflict = existingAppointments.some(existingApp => {
      const existingAppStartDate = new Date(existingApp.date);
      // Use the actual duration from the database + prep time for conflict checking
      const existingAppEndDate = addMinutes(existingAppStartDate, existingApp.duration + PREP_TIME);
      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      return appointmentDate < existingAppEndDate && appointmentEndDate > existingAppStartDate;
    });
  
    if (hasConflict) {
        setIsConflictDialogOpen(true);
        return;
    }

    let userId: string | null | undefined = null;
    let userName = '';
    let userEmail = '';

    if (values.isGuest) {
        // Guest Logic
        userId = null; // Assuming DB allows null, or we leave it empty depending on schema
        userName = values.guestName || 'Invité';
        userEmail = values.guestEmail || '';
    } else {
        // Registered User Logic
        userId = values.userId;
        const existingUser = users.find(u => u.id === userId);
        if (!existingUser) {
              toast({ variant: "destructive", title: "Utilisateur non trouvé", description: "Le client sélectionné n'est pas valide." });
              return;
        }
        userName = existingUser.display_name || existingUser.email || 'Client';
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
        const { data, error: insertAppError } = await supabase.from('appointments').insert(dataToSave).select().single();
        if (insertAppError) throw insertAppError;
        
        // Mise à jour locale immédiate
        if (data) {
             setAppointments(prev => [data as Appointment, ...prev]);
        }

        toast({
            title: "Rendez-vous Créé !",
            description: "Le nouveau rendez-vous a été ajouté avec succès.",
        });
        setIsFormSheetOpen(false);
        setNewAppointmentSlot(null);
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Erreur lors de la création du rendez-vous",
            description: e.message || "Une erreur inattendue est survenue.",
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
            title: "Prix non trouvé",
            description: "Impossible de trouver le prix pour ce service et cette durée.",
        });
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentDetails) return;

    try {
        const { data, error } = await supabase
            .from('appointments')
            .update({ status: 'Concluído' })
            .eq('id', paymentDetails.appointment.id)
            .select()
            .single();

        if (error) throw error;

        // Mise à jour locale immédiate
        if (data) {
            setAppointments(prev => prev.map(app => app.id === data.id ? data as Appointment : app));
        }

        toast({ title: 'Paiement Traité !', description: 'Le rendez-vous a été marqué comme terminé.' });
    } catch (e: any) {
        toast({ variant: "destructive", title: "Erreur lors du traitement du paiement", description: e.message });
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button onClick={handleManualNewAppointment}>
            <PlusCircle className="mr-2 h-4 w-4"/> Nouveau Rendez-vous
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="list">
            <TabsList className="h-auto flex-wrap justify-start w-full sm:w-auto">
              <TabsTrigger value="list">Liste</TabsTrigger>
              <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
              <TabsTrigger value="month">Mois</TabsTrigger>
            </TabsList>

            {isLoading && (
                 <div className="mt-4 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            )}
            
            {!isLoading && services && (
              <>
                <TabsContent value="list">
                    <AdminAppointmentsTable 
                        appointments={appointments}
                        onPay={handleOpenPaymentSheet}
                        onDelete={handleOpenDeleteDialog}
                    />
                </TabsContent>
                <TabsContent value="today">
                  <AgendaView 
                    days={[new Date()]} 
                    timeSlots={allTimeSlots} 
                    appointments={todayAppointments}
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
                            locale={fr}
                            components={{ Day: DayWithAppointments }}
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold">
                            Rendez-vous pour le {selectedDay ? format(selectedDay, 'd MMMM, yyyy', { locale: fr }) : 'Aucun jour sélectionné'}
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
                                <p className="mt-2">Aucun rendez-vous pour ce jour.</p>
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
            <AlertDialogTitle>Êtes-vous absolument sûr(e) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le rendez-vous pour
              <span className="font-semibold"> {selectedAppointment?.service_name} </span>
              de
              <span className="font-semibold"> {selectedAppointment?.user_name} </span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isFormSheetOpen} onOpenChange={setIsFormSheetOpen}>
        <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col gap-0 h-full" side="right">
          <div className="px-6 py-4 border-b flex-none">
            <SheetHeader className="text-left">
                <SheetTitle>Nouveau Rendez-vous</SheetTitle>
                {newAppointmentSlot && (
                    <SheetDescription>
                        Le {format(newAppointmentSlot.date, 'd MMMM, yyyy', {locale: fr})} à {newAppointmentSlot.time}.
                    </SheetDescription>
                )}
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <AdminAppointmentForm
                users={users || []}
                services={services || []}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={isConflictDialogOpen} onOpenChange={setIsConflictDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive"/> Conflit d'horaire
            </AlertDialogTitle>
            <AlertDialogDescription>
                Il existe déjà un rendez-vous pour ce service qui chevauche l'heure sélectionnée. Veuillez choisir une autre heure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsConflictDialogOpen(false)}>Compris</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
         <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col gap-0 h-full">
          <div className="px-6 py-4 border-b flex-none">
            <SheetHeader className="text-left">
                <SheetTitle>Traiter le Paiement</SheetTitle>
                {paymentDetails && (
                    <SheetDescription>
                    Traitement pour {paymentDetails.appointment.service_name}.
                    </SheetDescription>
                )}
            </SheetHeader>
          </div>
          {paymentDetails && (
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <Card className="border-none shadow-none bg-muted/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-background">
                            <AvatarFallback>{getInitials(paymentDetails.user?.display_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-lg">{paymentDetails.user?.display_name || paymentDetails.user?.email}</p>
                            <p className="text-sm text-muted-foreground">{paymentDetails.user?.email}</p>
                        </div>
                    </CardContent>
                    <Separator className="my-0" />
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm bg-muted/50">
                        <div className="flex items-center gap-3 p-2 rounded-md bg-background shadow-sm">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Star className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Abonnement</p>
                                <p className="font-medium truncate">{paymentDetails.userPlan?.title || 'Aucun'}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 p-2 rounded-md bg-background shadow-sm">
                             <div className="p-2 bg-primary/10 rounded-full">
                                <Wallet className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Minutes</p>
                                <p className="font-medium">{paymentDetails.user?.minutes_balance ?? 0} min</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col items-center justify-center p-8 bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl gap-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Montant à Payer</p>
                    <p className="text-5xl font-black tracking-tight text-primary">€{paymentDetails.price.toFixed(2)}</p>
                </div>

                <div className="space-y-4">
                    <Label htmlFor="amount-paid" className="text-base">Montant Reçu (€)</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            id="amount-paid"
                            type="number"
                            className="pl-12 h-14 text-lg"
                            placeholder="0.00"
                            value={amountPaid}
                            onChange={e => setAmountPaid(e.target.value)}
                        />
                    </div>
                </div>
                 {calculateChange() >= 0 && amountPaid !== '' && (
                    <div className="flex items-center justify-between p-4 bg-green-100/50 border border-green-200 dark:border-green-900/50 dark:bg-green-900/20 rounded-lg animate-in slide-in-from-bottom-2">
                        <span className="font-medium text-green-700 dark:text-green-300">Monnaie à rendre</span>
                        <span className="text-2xl font-bold text-green-800 dark:text-green-200">€{calculateChange().toFixed(2)}</span>
                    </div>
                )}
            </div>
          )}
           <div className="p-6 border-t bg-background mt-auto flex-none">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between w-full gap-3">
                    <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDeleteFromPaymentSheet}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                    </Button>
                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <Button variant="outline" onClick={() => setIsPaymentSheetOpen(false)}>Annuler</Button>
                        <Button onClick={handleConfirmPayment} disabled={calculateChange() < 0} className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="mr-2 h-4 w-4" /> Encaisser
                        </Button>
                    </div>
                </div>
           </div>
         </SheetContent>
      </Sheet>
    </>
  );
}