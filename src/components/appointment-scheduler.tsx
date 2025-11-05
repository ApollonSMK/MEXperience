'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, Loader2, AlertTriangle, Wrench, Calendar as CalendarIcon, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { format, getDay, isBefore, parse, addMinutes, differenceInMinutes, isSameDay, addDays, startOfToday, eachDayOfInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '@/app/profile/appointments/page';
import { Skeleton } from './ui/skeleton';
import type { Service } from '@/app/admin/services/page';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Separator } from './ui/separator';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

interface AppointmentSchedulerProps {
  onBookingComplete: () => void;
  onGuestBookingComplete: () => void;
}

interface UserProfile {
    id: string;
    display_name: string;
    email: string;
    plan_id?: string;
    minutes_balance?: number;
}

interface Schedule {
    id: string;
    day_name: string;
    time_slots: string[];
    order: number;
}


export function AppointmentScheduler({ onBookingComplete, onGuestBookingComplete }: AppointmentSchedulerProps) {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [dailyAppointments, setDailyAppointments] = useState<Appointment[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [areDetailsLoading, setAreDetailsLoading] = useState(false);

  const [step, setStep] = useState<'select_service' | 'select_date_time'>('select_service');
  
  const [activeServiceId, setActiveServiceId] = useState<string | undefined>();
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const isRescheduling = !!appointmentToReschedule;
  const isGuestFlow = !user && !isRescheduling;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInsufficientMinutesOpen, setIsInsufficientMinutesOpen] = useState(false);
  const [minutesError, setMinutesError] = useState('');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollAreaRef.current) {
        const scrollAmount = direction === 'left' ? -300 : 300;
        scrollAreaRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };


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
        else {
            const fetchedServices = (servicesData as Service[] || []);
            setServices(fetchedServices);
            if(fetchedServices.length > 0) {
                const availableServices = fetchedServices.filter(s => !s.is_under_maintenance);
                if(availableServices.length > 0) {
                   setActiveServiceId(availableServices[0].id);
                }
            }
        }

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
        setActiveServiceId(existingService.id);
        const tier = existingService.pricing_tiers.find(t => t.duration === appointmentToReschedule.duration);
        if (tier) {
            setSelectedDuration(tier.duration);
            setSelectedPrice(tier.price);
        }
      }
      const rescheduleDate = new Date(appointmentToReschedule.date);
      setSelectedDate(rescheduleDate);
      setCurrentMonth(rescheduleDate);
    }
  }, [appointmentToReschedule, services]);
  
  // Fetch dynamic data (appointments, locks) when selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchDynamicData = async () => {
        setAreDetailsLoading(true);
        const start = format(selectedDate, 'yyyy-MM-dd') + 'T00:00:00.000Z';
        const end = format(selectedDate, 'yyyy-MM-dd') + 'T23:59:59.999Z';

        const { data: appointmentsData, error: appointmentsError } = await supabase.from('appointments').select('*').gte('date', start).lte('date', end);

        if (appointmentsError) toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger les agendamentos do dia." });
        else setDailyAppointments(appointmentsData as Appointment[] || []);
        
        setAreDetailsLoading(false);
    };

    fetchDynamicData();
  }, [selectedDate, toast, supabase]);

  const selectedService = useMemo(() => services.find(s => s.id === activeServiceId), [services, activeServiceId]);
  const availableServices = useMemo(() => services?.filter(s => !s.is_under_maintenance) || [], [services]);
  const isSubscribed = useMemo(() => !!userData?.plan_id, [userData]);

  const handleSelectDuration = (duration: number, price: number) => {
    setSelectedDuration(duration);
    setSelectedPrice(price);
    setSelectedTime(null);
  }
  
  const allAvailableTimes = useMemo(() => {
    if (!schedules || !selectedDate) return [];
    const dayOfWeek = getDay(selectedDate);
    const scheduleDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=Sun, 1=Mon... -> 0=Mon, 1=Tues... & Sun=6
    const daySchedule = schedules.find(s => s.order === scheduleDayIndex + 1);
    return daySchedule ? daySchedule.time_slots.sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })) : [];
  }, [schedules, selectedDate]);
  
  const timeSlotInterval = useMemo(() => {
        if (allAvailableTimes.length < 2) return 15;
        const sortedSlots = [...allAvailableTimes].sort();
        const t1 = parse(sortedSlots[0], 'HH:mm', new Date());
        const t2 = parse(sortedSlots[1], 'HH:mm', new Date());
        const diff = differenceInMinutes(t2, t1);
        return diff > 0 ? diff : 15;
    }, [allAvailableTimes]);

  const busySlots = useMemo(() => {
    if (!dailyAppointments || !selectedDate) return new Set<string>();

    const busy = new Set<string>();
    const appointmentsOnDate = dailyAppointments.filter(
        (app) => app.status === 'Confirmado' && app.id !== appointmentToReschedule?.id
    );

    appointmentsOnDate.forEach((app) => {
        const startTime = new Date(app.date);
        const PREP_TIME = 15; // Admin-side prep time
        const totalBlockedDuration = app.duration + PREP_TIME;
        const endTime = addMinutes(startTime, totalBlockedDuration);

        allAvailableTimes.forEach((timeSlot) => {
            if (!selectedDate) return;
            const slotStartTime = parse(timeSlot, 'HH:mm', selectedDate);
            const slotEndTime = addMinutes(slotStartTime, timeSlotInterval);

            // Check for overlap: (StartA < EndB) and (EndA > StartB)
            if (startTime < slotEndTime && endTime > slotStartTime) {
                busy.add(timeSlot);
            }
        });
    });

    return busy;
  }, [dailyAppointments, selectedDate, allAvailableTimes, appointmentToReschedule, timeSlotInterval]);


  const trulyAvailableTimes = useMemo(() => {
    if (!allAvailableTimes) return [];
    return allAvailableTimes.filter(time => {
        if (!selectedDate) return false;
        
        const isPast = isSameDay(selectedDate, new Date()) && isBefore(parse(time, 'HH:mm', new Date()), new Date());
        if (isPast) {
            return false;
        }

        const isBusy = busySlots.has(time);
        return !isBusy;
    });
  }, [allAvailableTimes, selectedDate, busySlots]);

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
            const paymentMethod = isSubscribed ? 'minutes' : 'reception';
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

  const handleServiceTabChange = (serviceId: string) => {
    setActiveServiceId(serviceId);
    setSelectedDuration(null);
    setSelectedPrice(null);
    setSelectedTime(null);
  };

  const handleGoToNextStep = () => {
    setStep('select_date_time');
  }

  const handleGoBack = () => {
    if (step === 'select_date_time') {
        setSelectedTime(null);
        setStep('select_service');
    } else {
        router.back();
    }
  }

  const today = startOfToday();
  const futureDays = eachDayOfInterval({
    start: today,
    end: addDays(today, 90),
  });

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
            
            {step === 'select_service' && (
              <div className="space-y-8 animate-in fade-in-0 duration-300">
                <div className="relative">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex space-x-2 pb-4">
                        {availableServices.map(service => (
                            <Button
                                key={service.id}
                                variant={activeServiceId === service.id ? "default" : "outline"}
                                className={cn(
                                "shrink-0 font-bold",
                                activeServiceId === service.id
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "bg-transparent hover:bg-accent"
                                )}
                                onClick={() => handleServiceTabChange(service.id)}
                                disabled={isRescheduling && service.id !== activeServiceId}
                            >
                                {service.name}
                            </Button>
                        ))}
                        </div>
                    </ScrollArea>
                </div>

                <div className="space-y-4">
                    {selectedService?.pricing_tiers.map(tier => (
                        <Card 
                            key={tier.duration} 
                            className={cn("p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors", selectedDuration === tier.duration && "ring-2 ring-primary")}
                            onClick={() => handleSelectDuration(tier.duration, tier.price)}
                        >
                            <div>
                                <h4 className="font-semibold">{tier.duration} min</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {isSubscribed ? `Déduit de votre solde` : `à partir de ${tier.price.toFixed(2)} €`}
                                </p>
                            </div>
                            <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all", selectedDuration === tier.duration ? "bg-primary border-primary" : "border-muted")}>
                                {selectedDuration === tier.duration && <Check className="h-4 w-4 text-primary-foreground" />}
                            </div>
                        </Card>
                    ))}
                    {selectedService && selectedService.is_under_maintenance && (
                        <div className="flex items-center gap-2 text-sm text-destructive p-4 bg-destructive/10 rounded-lg">
                            <Wrench className="h-5 w-5" />
                            Ce service est currently en maintenance et ne peut pas être réservé.
                        </div>
                    )}
                </div>
              </div>
            )}
            
            
            {/* --- Date & Time --- */}
            {step === 'select_date_time' && (
                 <Card className="animate-in fade-in-0 duration-300">
                    <CardHeader>
                        <div className="flex justify-between items-center px-2">
                            <h3 className="font-semibold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: fr })}</h3>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => addDays(prev, -30))}><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => addDays(prev, 30))}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleScroll('left')}><ChevronLeft className="h-4 w-4" /></Button>
                            <ScrollArea className="w-full whitespace-nowrap">
                                <div className="flex space-x-2 pb-4" ref={scrollAreaRef}>
                                    {futureDays.map(day => {
                                        const isDaySelected = selectedDate ? isSameDay(day, selectedDate) : false;
                                        
                                        return (
                                            <div 
                                                key={day.toString()}
                                                onClick={() => {
                                                    setSelectedDate(day);
                                                    setSelectedTime(null);
                                                }}
                                                className={cn(
                                                    "flex flex-col items-center justify-start text-center gap-2 cursor-pointer p-1 rounded-md transition-colors w-14 shrink-0",
                                                    !isDaySelected && "hover:bg-muted"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex items-center justify-center h-10 w-10 rounded-full border transition-colors",
                                                    isDaySelected ? "bg-primary text-primary-foreground border-primary" : "border-border"
                                                )}>
                                                    <p className="font-semibold">{format(day, 'd')}</p>
                                                </div>
                                                <p className={cn(
                                                    "text-xs capitalize",
                                                    isDaySelected ? "text-primary font-semibold" : "text-muted-foreground",
                                                )}>{format(day, 'E', { locale: fr })}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                            <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleScroll('right')}><ChevronRight className="h-4 w-4" /></Button>
                       </div>
                        <Separator className="my-4"/>
                        <div className="space-y-2">
                            {areDetailsLoading ? Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                            : trulyAvailableTimes.length > 0 ? (
                                <div className="space-y-2">
                                {trulyAvailableTimes.map(time => (
                                    <Card 
                                        key={time}
                                        className={cn(
                                            "cursor-pointer hover:bg-muted/50 transition-colors p-3 text-center",
                                            selectedTime === time && "ring-2 ring-primary bg-muted"
                                        )}
                                        onClick={() => setSelectedTime(time)}
                                    >
                                        <p className="font-semibold">{time}</p>
                                    </Card>
                                ))}
                                </div>
                            )
                            : 
                            <div className="col-span-full flex flex-col items-center justify-center p-8 rounded-lg bg-muted/50">
                                <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4"/>
                                <p className="font-semibold">Aucun créneau disponible</p>
                                <p className="text-sm text-muted-foreground">Veuillez sélectionner une autre date.</p>
                            </div>
                            }
                        </div>
                    </CardContent>
                 </Card>
            )}
        </div>

        {/* --- Summary Column --- */}
        <div className="lg:col-span-1">
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle>M.E Beauty</CardTitle>
                    <CardDescription>Grand-Rue 20, Kayl, Esch-sur-alzette</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator/>
                   {selectedService && selectedDuration && selectedPrice !== null ? (
                      <div>
                        <div className="flex justify-between items-center py-2">
                           <div>
                              <p className="font-semibold">{selectedService.name}</p>
                           </div>
                           <p className="font-semibold">€{isSubscribed || isRescheduling ? '0.00' : (selectedPrice || 0).toFixed(2)}</p>
                        </div>
                         <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <p>Durée</p>
                            <p>{selectedDuration} min</p>
                         </div>

                         {selectedDate && selectedTime && (
                           <div className="text-sm text-muted-foreground flex items-center gap-2 pt-2">
                            <CalendarIcon className="h-4 w-4" /> {format(selectedDate, "d MMM yyyy", { locale: fr })} à {selectedTime}
                           </div>
                         )}
                      </div>
                   ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>Sélectionnez une prestation pour voir le résumé.</p>
                    </div>
                   )}
                   <Separator/>
                   <div className="flex justify-between items-center font-bold text-lg">
                       <p>Total</p>
                       <p>€{isSubscribed || isRescheduling ? '0.00' : (selectedPrice || 0).toFixed(2)}</p>
                   </div>
                </CardContent>
                <CardFooter>
                    {step === 'select_service' ? (
                        <Button 
                            className="w-full"
                            size="lg"
                            disabled={!selectedDuration}
                            onClick={handleGoToNextStep}
                        >
                            Continuez
                        </Button>
                    ) : (
                        <Button 
                            className="w-full"
                            size="lg"
                            disabled={!selectedTime || isSubmitting}
                            onClick={handleConfirmBooking}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isRescheduling ? 'Confirmer la Replanification' : 'Confirmer la Réservation'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
      </div>
    </>
  );
}
