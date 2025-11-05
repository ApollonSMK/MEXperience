'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, CreditCard, Loader2, AlertTriangle, Wrench, Wallet, User as UserIcon, Calendar as CalendarIcon, Clock, Tag, ArrowLeft } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { format, getDay, addMinutes, parse, startOfDay, endOfDay, add, differenceInMinutes, isBefore, startOfToday, isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '@/app/profile/appointments/page';
import { Skeleton } from './ui/skeleton';
import type { Service } from '@/app/admin/services/page';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from './ui/separator';

interface AppointmentSchedulerProps {
  onBookingComplete: () => void;
  onGuestBookingComplete: () => void;
}

interface Schedule {
    id: string;
    day_name: string;
    time_slots: string[];
    order: number;
}

interface TimeSlotLock {
    id: string;
    service_id: string;
    date: string;
    time: string;
    locked_by_user_id: string;
    expires_at: string; // ISO string
}

interface UserProfile {
    id: string;
    display_name: string;
    email: string;
    plan_id?: string;
    minutes_balance?: number;
}

const paymentMethodLabels = {
    card: 'Carte de crédit (en ligne)',
    minutes: 'Minutes d\'abonnement',
    reception: 'Payer à la réception',
};

const StepIndicator = ({ step, title, status }: { step: number, title: string, status: 'complete' | 'current' | 'incomplete' }) => (
    <div className="flex items-center gap-4">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold", 
            status === 'complete' ? 'bg-primary text-primary-foreground' :
            status === 'current' ? 'border-2 border-primary text-primary' :
            'border-2 border-muted-foreground text-muted-foreground'
        )}>
            {status === 'complete' ? <Check className="h-5 w-5" /> : step}
        </div>
        <h3 className={cn("text-lg font-semibold", status === 'incomplete' && 'text-muted-foreground')}>{title}</h3>
    </div>
)

export function AppointmentScheduler({ onBookingComplete, onGuestBookingComplete }: AppointmentSchedulerProps) {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [dailyAppointments, setDailyAppointments] = useState<Appointment[]>([]);
  const [dailyLocks, setDailyLocks] = useState<TimeSlotLock[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [areDetailsLoading, setAreDetailsLoading] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const isRescheduling = !!appointmentToReschedule;
  const isGuestFlow = !user && !isRescheduling;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [isInsufficientMinutesOpen, setIsInsufficientMinutesOpen] = useState(false);
  const [minutesError, setMinutesError] = useState('');
  
  useEffect(() => {
    const rescheduleData = sessionStorage.getItem('rescheduleAppointment');
    if (rescheduleData) {
      setAppointmentToReschedule(JSON.parse(rescheduleData));
      sessionStorage.removeItem('rescheduleAppointment');
    }
  }, []);
  
  // Fetch initial static data (services, schedules) and user data
  useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        const servicesPromise = supabase.from('services').select('*').order('order');
        const schedulesPromise = supabase.from('schedules').select('*').order('order');
        
        let profilePromise;
        if (currentUser) {
            profilePromise = supabase.from('profiles').select('id, display_name, email, plan_id, minutes_balance').eq('id', currentUser.id).single();
        } else {
            profilePromise = Promise.resolve({ data: null, error: null });
        }

        const [
            { data: profileData, error: profileError },
            { data: servicesData, error: servicesError },
            { data: schedulesData, error: schedulesError }
        ] = await Promise.all([profilePromise, servicesPromise, schedulesPromise]);

        if (profileError && currentUser) toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger les données de l'utilisateur." });
        else setUserData(profileData);

        if (servicesError) toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les services.' });
        else setServices(servicesData as Service[] || []);

        if (schedulesError) toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les horaires.' });
        else setSchedules(schedulesData as Schedule[] || []);

        setIsLoading(false);
    };
    fetchInitialData();
  }, [toast, supabase]);

   useEffect(() => {
    if (appointmentToReschedule && services.length > 0) {
      const existingService = services.find(s => s.name === appointmentToReschedule.service_name);
      if(existingService) {
        setSelectedService(existingService);
        const tier = existingService.pricing_tiers.find(t => t.duration === appointmentToReschedule.duration);
        if (tier) {
            setSelectedDuration(tier.duration);
            setSelectedPrice(tier.price);
        }
      }
      setSelectedDate(new Date(appointmentToReschedule.date));
    }
  }, [appointmentToReschedule, services]);
  
  // Fetch dynamic data (appointments, locks) when selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchDynamicData = async () => {
        setAreDetailsLoading(true);
        const start = startOfDay(selectedDate);
        const end = endOfDay(selectedDate);

        const { data: appointmentsData, error: appointmentsError } = await supabase.from('appointments').select('*').gte('date', start.toISOString()).lte('date', end.toISOString());

        if (appointmentsError) toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger les agendamentos do dia." });
        else setDailyAppointments(appointmentsData as Appointment[] || []);
        
        setAreDetailsLoading(false);
    };

    fetchDynamicData();
  }, [selectedDate, toast, supabase]);


  const availableServices = useMemo(() => services?.filter(s => !s.is_under_maintenance) || [], [services]);
  const isSubscribed = useMemo(() => !!userData?.plan_id, [userData]);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setSelectedDuration(null);
    setSelectedPrice(null);
    setSelectedTime(null);
  }

  const handleSelectDuration = (duration: number, price: number) => {
    setSelectedDuration(duration);
    setSelectedPrice(price);
    setSelectedTime(null);
  }
  
  const availableTimes = useMemo(() => {
    if (!schedules || !selectedDate) return [];
    const dayOfWeek = getDay(selectedDate); // 0 (Sun) - 6 (Sat)
    const scheduleDayIndex = dayOfWeek === 0 ? 7 : dayOfWeek; // Map to 1 (Mon) - 7 (Sun)
    const daySchedule = schedules.find(s => s.order === scheduleDayIndex);
    return daySchedule ? daySchedule.time_slots.sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })) : [];
  }, [schedules, selectedDate]);
  
  const timeSlotInterval = useMemo(() => {
      if (availableTimes.length < 2) return 15;
      const t1 = parse(availableTimes[0], 'HH:mm', new Date());
      const t2 = parse(availableTimes[1], 'HH:mm', new Date());
      const diff = differenceInMinutes(t2, t1);
      return diff > 0 ? diff : 15;
  }, [availableTimes]);

  const busySlots = useMemo(() => {
    if (!dailyAppointments || !selectedDate) return new Set<string>();
    
    const PREP_TIME = 15; // 15 minutes buffer time
    const busy = new Set<string>();

    const appointmentsOnDate = dailyAppointments.filter(app => 
        app.status === 'Confirmado' &&
        app.id !== appointmentToReschedule?.id
    );

    appointmentsOnDate.forEach(app => {
        const startTime = new Date(app.date);
        const totalBlockedTime = app.duration + PREP_TIME;
        const endTime = addMinutes(startTime, totalBlockedTime);
        
        availableTimes.forEach(timeSlot => {
            const slotTime = parse(timeSlot, 'HH:mm', new Date(selectedDate));
            const slotEndTime = addMinutes(slotTime, timeSlotInterval);

            // Check for overlap: (StartA < EndB) and (EndA > StartB)
            if (startTime < slotEndTime && endTime > slotTime) {
                busy.add(timeSlot);
            }
        });
    });

    return busy;
  }, [dailyAppointments, selectedDate, availableTimes, timeSlotInterval, appointmentToReschedule]);

  const handleConfirmBooking = async () => {
     if (!selectedService || !selectedDuration || !selectedDate || !selectedTime) {
        toast({ variant: "destructive", title: "Informations manquantes", description: "Veuillez compléter toutes les étapes." });
        return;
    }
    
    setIsSubmitting(true);

    let userId = user?.id;
    let userName = userData?.display_name;
    let userEmail = userData?.email;

    try {
        if (!userId && isGuestFlow) {
            // This part is simplified as we assume guest has created account before reaching scheduler
            // A real implementation would need a guest user creation flow here if they aren't logged in.
            toast({ variant: 'destructive', title: 'Erreur', description: "Veuillez vous connecter ou créer un compte."});
            router.push('/signup');
            setIsSubmitting(false);
            return;
        }
        
        if (!userId || !userName || !userEmail) {
            throw new Error("Données utilisateur non trouvées.");
        }
        
        if (isSubscribed && !isRescheduling) {
            const currentBalance = userData?.minutes_balance ?? 0;
            if (currentBalance < selectedDuration) {
                setMinutesError(`Vous avez ${currentBalance} minutes, mais ce soin en requiert ${selectedDuration}.`);
                setIsInsufficientMinutesOpen(true);
                setIsSubmitting(false);
                return;
            }
        }
        
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(hours, minutes);

        if (isRescheduling && appointmentToReschedule) {
            const { error } = await supabase.from('appointments').update({
                date: appointmentDate.toISOString(),
            }).eq('id', appointmentToReschedule.id);

            if(error) throw error;
            toast({ title: "Rendez-vous replanifié !", description: "Votre rendez-vous a été mis à jour avec succès." });

        } else {
            const paymentMethod = isSubscribed ? 'minutes' : 'reception'; // Simplified payment logic
            if (paymentMethod === 'minutes') {
                const currentBalance = userData?.minutes_balance ?? 0;
                const newBalance = currentBalance - selectedDuration;
                await supabase.from('profiles').update({ minutes_balance: newBalance }).eq('id', userId);
            }

            const { error } = await supabase.from('appointments').insert({
                user_id: userId,
                user_name: userName,
                user_email: userEmail,
                service_name: selectedService.name,
                date: appointmentDate.toISOString(),
                duration: selectedDuration,
                status: 'Confirmado',
                payment_method: paymentMethod,
            });

            if(error) throw error;
        }

        if (isGuestFlow) {
            onGuestBookingComplete();
        } else {
            onBookingComplete();
        }

    } catch (error: any) {
        toast({ variant: "destructive", title: "Erreur de Planification", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const availablePricingTiers = useMemo(() => {
    if (!selectedService) return [];
    return selectedService.pricing_tiers || [];
  }, [selectedService]);
  
  if (isLoading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
            <div className="md:col-span-1">
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    )
  }

  return (
    <>
      <AlertDialog open={isInsufficientMinutesOpen} onOpenChange={setIsInsufficientMinutesOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive"/> Solde de minutes insuffisant
            </AlertDialogTitle>
            <AlertDialogDescription>
               {minutesError} Vous pouvez acheter plus de minutes ou payer cette session à la réception.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
             <AlertDialogAction onClick={() => router.push('/#pricing')}>
                Acheter plus de minutes
            </AlertDialogAction>
             <AlertDialogAction onClick={() => { setIsInsufficientMinutesOpen(false); handleConfirmBooking(); }} variant="secondary">
                Payer à la réception
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* --- Main Content --- */}
        <div className="lg:col-span-2 space-y-8">
            {isRescheduling && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-blue-500" />
                    Vous êtes en train de replanifier votre rendez-vous pour <span className="font-semibold text-foreground">{selectedService?.name}</span>.
                </div>
            )}
            {/* --- Services --- */}
            <div id="step-1">
                <StepIndicator step={1} title="Choisissez votre service" status={selectedService ? 'complete' : 'current'} />
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {availableServices.map(service => (
                        <Card 
                            key={service.id} 
                            className={cn("p-4 flex flex-col items-start justify-center text-left cursor-pointer hover:bg-muted/50", selectedService?.id === service.id && "ring-2 ring-primary", isRescheduling && service.id !== selectedService?.id && "opacity-50 cursor-not-allowed")}
                            onClick={() => !isRescheduling && handleSelectService(service)}
                        >
                            <h4 className="font-semibold text-sm">{service.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                        </Card>
                    ))}
                    {services?.filter(s => s.is_under_maintenance).map(service => (
                        <Card key={service.id} className="p-4 flex flex-col items-start justify-center text-left cursor-not-allowed bg-muted/50 opacity-60">
                            <h4 className="font-semibold text-sm">{service.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                            <Badge variant="destructive" className="mt-2 text-xs"><Wrench className="h-3 w-3 mr-1" />Maint.</Badge>
                        </Card>
                    ))}
                </div>
            </div>
            
            {/* --- Duration --- */}
            {selectedService && !isRescheduling && (
                <div id="step-2">
                    <StepIndicator step={2} title="Choisissez la durée" status={selectedDuration ? 'complete' : 'current'} />
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {availablePricingTiers.map(tier => (
                            <Card 
                                key={tier.duration} 
                                className={cn("p-4 flex flex-col text-center items-center justify-center cursor-pointer hover:bg-muted/50", selectedDuration === tier.duration && "ring-2 ring-primary")}
                                onClick={() => handleSelectDuration(tier.duration, tier.price)}
                            >
                                <p className="font-semibold">{tier.duration} min</p>
                                {!isSubscribed && <p className="text-xs text-muted-foreground mt-1">€{tier.price.toFixed(2)}</p>}
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            
            {/* --- Date & Time --- */}
            {(selectedDuration || isRescheduling) && (
                 <div id="step-3">
                    <StepIndicator step={isRescheduling ? 2 : 3} title="Choisissez la date et l'heure" status={selectedTime ? 'complete' : 'current'} />
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                                setSelectedDate(date);
                                setSelectedTime(null);
                            }}
                            className="rounded-md border w-fit"
                            locale={fr}
                            fromDate={new Date()}
                        />
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 h-fit">
                            {areDetailsLoading ? Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                            : availableTimes.length > 0 ? availableTimes.map(time => {
                                const isPast = selectedDate && isSameDay(selectedDate, new Date()) && isBefore(parse(time, 'HH:mm', new Date()), new Date());
                                const isDisabled = busySlots.has(time) || isPast;

                                return (
                                    <Button 
                                        key={time}
                                        variant={selectedTime === time ? 'default' : 'outline'}
                                        onClick={() => setSelectedTime(time)}
                                        disabled={isDisabled}
                                    >
                                        {time}
                                    </Button>
                                );
                            }) : <p className="col-span-full text-center text-muted-foreground mt-8">Aucun créneau disponible.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* --- Summary Column --- */}
        <div className="lg:col-span-1">
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle>Votre Rendez-vous</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user && !isGuestFlow && (
                        <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold text-sm">{userData?.display_name}</p>
                                <p className="text-xs text-muted-foreground">{userData?.email}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="font-semibold">{selectedService?.name || 'Aucun service'}</p>
                        {selectedService && <p className="text-sm text-muted-foreground">{selectedService.description}</p>}
                    </div>

                    {(selectedDate || selectedTime) && <Separator />}

                    {selectedDate && (
                         <div className="flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                            <p>{format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: fr })}</p>
                        </div>
                    )}
                    {selectedTime && (
                         <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <p>{selectedTime}</p>
                        </div>
                    )}

                    {selectedPrice !== null && (
                        <>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <p className="font-semibold">Total</p>
                                <p className="font-bold text-xl">
                                    {isSubscribed || isRescheduling ? '0.00 €' : `€${(selectedPrice || 0).toFixed(2)}`}
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isSubscribed ? "Ce soin sera déduit de votre solde de minutes." : isRescheduling ? "Ceci est une replanification, aucun coût supplémentaire." : "Vous paierez à la réception ou en ligne à la prochaine étape."}
                            </p>
                        </>
                    )}
                </CardContent>
                <CardFooter>
                    <Button 
                        className="w-full"
                        size="lg"
                        disabled={!selectedTime || isSubmitting}
                        onClick={handleConfirmBooking}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isRescheduling ? 'Replanifier le rendez-vous' : 'Confirmer le rendez-vous'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </>
  );
}

    