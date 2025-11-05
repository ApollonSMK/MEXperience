'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, CreditCard, Banknote, Landmark, Loader2, AlertTriangle, Wrench, ShoppingCart, Wallet, User as UserIcon } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { format, getDay, isSameDay, addMinutes, parse, startOfDay, endOfDay, add, differenceInMinutes } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '@/app/profile/appointments/page';
import { Skeleton } from './ui/skeleton';
import type { Service } from '@/app/admin/services/page';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface AppointmentSchedulerProps {
  onBookingComplete: () => void;
  appointmentToReschedule?: Appointment | null;
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
    plan_id?: string;
    minutes_balance?: number;
}

const guestSchema = z.object({
  guestName: z.string().min(1, { message: "Le nom est requis." }),
  guestEmail: z.string().email({ message: "L'adresse e-mail est invalide." }),
  guestPhone: z.string().optional(),
});
type GuestFormValues = z.infer<typeof guestSchema>;


const paymentMethodLabels = {
    card: 'Carte de crédit',
    minutes: 'Minutes d\'abonnement',
    reception: 'Payer à la réception',
};

export function AppointmentScheduler({ onBookingComplete, appointmentToReschedule }: AppointmentSchedulerProps) {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [dailyAppointments, setDailyAppointments] = useState<Appointment[]>([]);
  const [dailyLocks, setDailyLocks] = useState<TimeSlotLock[]>([]);

  const [areServicesLoading, setAreServicesLoading] = useState(true);
  const [areSchedulesLoading, setAreSchedulesLoading] = useState(true);
  const [areAppointmentsLoading, setAreAppointmentsLoading] = useState(false);
  const [areLocksLoading, setAreLocksLoading] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [isGuestFlow, setIsGuestFlow] = useState(false);
  const isSubscribed = useMemo(() => !!userData?.plan_id, [userData]);

  const guestForm = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
        guestName: '',
        guestEmail: '',
        guestPhone: '',
    },
  });
  

  // Fetch initial static data (services, schedules) and user data
  useEffect(() => {
    const fetchInitialData = async () => {
        setAreServicesLoading(true);
        setAreSchedulesLoading(true);

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        setIsGuestFlow(!currentUser);

        const servicesPromise = supabase.from('services').select('*').order('order');
        const schedulesPromise = supabase.from('schedules').select('*').order('order');
        
        let profilePromise;
        if (currentUser) {
            profilePromise = supabase.from('profiles').select('id, plan_id, minutes_balance').eq('id', currentUser.id).single();
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


        setAreServicesLoading(false);
        setAreSchedulesLoading(false);
    };
    fetchInitialData();
  }, [toast, supabase]);
  
  // Fetch dynamic data (appointments, locks) when selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchDynamicData = async () => {
        setAreAppointmentsLoading(true);
        setAreLocksLoading(true);

        const start = startOfDay(selectedDate);
        const end = endOfDay(selectedDate);

        const appointmentsPromise = supabase.from('appointments').select('*').gte('date', start.toISOString()).lte('date', end.toISOString());
        const locksPromise = supabase.from('time_slot_locks').select('*').eq('date', format(selectedDate, 'yyyy-MM-dd'));

        const [
            { data: appointmentsData, error: appointmentsError },
            { data: locksData, error: locksError }
        ] = await Promise.all([appointmentsPromise, locksPromise]);

        if (appointmentsError) toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger les agendamentos do dia." });
        else setDailyAppointments(appointmentsData as Appointment[] || []);

        if (locksError) toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de vérifier les blocages d'horaires." });
        else setDailyLocks(locksData as TimeSlotLock[] || []);

        setAreAppointmentsLoading(false);
        setAreLocksLoading(false);
    };

    fetchDynamicData();
  }, [selectedDate, toast, supabase]);


  const availableServices = useMemo(() => {
    return services?.filter(s => !s.is_under_maintenance) || [];
  }, [services]);

  const isRescheduling = !!appointmentToReschedule;

  const steps = useMemo(() => {
    let baseSteps = [
      { id: 1, name: 'Service' },
      { id: 2, name: 'Durée' },
      { id: 3, name: 'Date' },
      { id: 4, name: 'Heure' },
    ];
    
    if (isRescheduling) {
        return [
            { id: 1, name: 'Date' },
            { id: 2, name: 'Heure' },
            { id: 3, name: 'Confirmation' },
        ];
    }
    
    if (isGuestFlow) {
        baseSteps.push({ id: baseSteps.length + 1, name: 'Vos Infos' });
    }

    if (!isSubscribed) {
        baseSteps.push({ id: baseSteps.length + 1, name: 'Paiement' });
    }
    
    baseSteps.push({ id: baseSteps.length + 1, name: 'Confirmation' });

    return baseSteps;
  }, [isSubscribed, isRescheduling, isGuestFlow]);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof paymentMethodLabels | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlotTaken, setIsSlotTaken] = useState(false);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [isInsufficientMinutesOpen, setIsInsufficientMinutesOpen] = useState(false);
  const [minutesError, setMinutesError] = useState('');
  const activeLockId = useRef<string | null>(null);


 const clearCurrentLock = useCallback(async () => {
    if (activeLockId.current) {
      const lockIdToDelete = activeLockId.current;
      activeLockId.current = null; // Clear ref immediately
      await supabase.from('time_slot_locks').delete().eq('id', lockIdToDelete);
    }
  }, [supabase]);


  const handleSelectTime = async (time: string) => {
    if (!selectedService || !selectedDate || !user) {
        setSelectedTime(time);
        return;
    }
    
    await clearCurrentLock();

    setSelectedTime(time);

    if (isSubscribed) {
        const expiresAt = add(new Date(), { minutes: 5 });

        const { data, error } = await supabase.from('time_slot_locks').insert({
            service_id: selectedService.id,
            date: format(selectedDate, 'yyyy-MM-dd'),
            time,
            locked_by_user_id: user.id,
            expires_at: expiresAt.toISOString(),
        }).select('id').single();
        
        if (error) {
          console.error("Failed to create lock", error);
        } else if (data) {
           activeLockId.current = data.id;
        }
    }
  };

  useEffect(() => {
    // This effect handles cleanup when the component unmounts
    return () => {
      clearCurrentLock();
    };
  }, [clearCurrentLock]);


  useEffect(() => {
    if (appointmentToReschedule && services.length > 0) {
      const existingService = services.find(s => s.name === appointmentToReschedule.service_name);
      setSelectedService(existingService || null);
      setSelectedDuration(appointmentToReschedule.duration);
      setSelectedDate(new Date(appointmentToReschedule.date));
      setPaymentMethod(appointmentToReschedule.payment_method);
      setCurrentStep(1);
    } else if (!isRescheduling) {
      // Reset state for new booking
      setSelectedService(null);
      setSelectedDuration(null);
      setSelectedDate(new Date());
      setSelectedTime(null);
      setPaymentMethod(isSubscribed ? 'minutes' : null);
      setCurrentStep(1);
    }
    // Cleanup lock on re-render if it's not a reschedule
    return () => {
      if(!isRescheduling) clearCurrentLock();
    };
  }, [appointmentToReschedule, services, isRescheduling, clearCurrentLock, isSubscribed]);
  

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const goToNextStep = async () => {
    // Validate guest form if on that step
    const currentStepConfig = steps.find(s => s.id === currentStep);
    if (currentStepConfig?.name === 'Vos Infos') {
        const isValid = await guestForm.trigger();
        if (!isValid) return;
    }
    
    let timeSelectionStep = 4;
    if (isRescheduling) timeSelectionStep = 2;

    if (currentStep === timeSelectionStep && selectedDate && selectedTime && user) {
        
        const { data: conflictingLock, error } = await supabase
            .from('time_slot_locks')
            .select('id')
            .eq('date', format(selectedDate, 'yyyy-MM-dd'))
            .eq('time', selectedTime)
            .not('locked_by_user_id', 'eq', user.id)
            .single();

        if (conflictingLock) {
            setIsSlotTaken(true);
            return;
        }
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length))
  };
  const goToPreviousStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDuration || !selectedDate || !selectedTime) {
        toast({
            variant: "destructive",
            title: "Erreur de validation",
            description: "Veuillez remplir tous les champs avant de confirmer.",
        });
        return;
    }
    
    setIsSubmitting(true);

    let userId = user?.id;
    let userName = user?.user_metadata?.display_name;
    let userEmail = user?.email;

    try {
        if(isGuestFlow) {
            const { guestName, guestEmail, guestPhone } = guestForm.getValues();
            if (!guestName || !guestEmail) {
                toast({ variant: 'destructive', title: 'Informations manquantes', description: 'Le nom et l\'e-mail sont requis pour les invités.'});
                setIsSubmitting(false);
                setCurrentStep(steps.find(s => s.name === 'Vos Infos')?.id || 1);
                return;
            }

            const guestUserData = {
                email: guestEmail,
                display_name: guestName,
                first_name: guestName.split(' ')[0] || '',
                last_name: guestName.split(' ').slice(1).join(' ') || '',
                phone: guestPhone || '',
                is_admin: false,
                minutes_balance: 0,
            };

            const { data: newProfile, error: insertError } = await supabase.from('profiles').insert(guestUserData).select().single();
            
            if (insertError) {
                throw insertError;
            }
            if (!newProfile) {
                throw new Error("La création du profil invité a échoué silencieusement. Le profil n'a pas été renvoyé après l'insertion.");
            }

            userId = newProfile.id;
            userName = newProfile.display_name;
            userEmail = newProfile.email;
        }
        
        if (!userId) {
            throw new Error("ID utilisateur non trouvé.");
        }

        const finalPaymentMethod = isSubscribed ? 'minutes' : paymentMethod;
        if (!finalPaymentMethod && !isRescheduling) {
          toast({ variant: "destructive", title: "Erreur de validation", description: "Veuillez sélectionner un mode de paiement." });
          setIsSubmitting(false);
          return;
        }

        if (finalPaymentMethod === 'minutes' && !isRescheduling) {
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
        
        const PREP_TIME = 15; // 15 minutes buffer time
        const totalBlockedTime = selectedDuration + PREP_TIME;
        const appointmentEndDate = addMinutes(appointmentDate, totalBlockedTime);

        const { data: conflictingAppointments, error: fetchError } = await supabase
            .from('appointments')
            .select('id, date, duration')
            .eq('service_name', selectedService.name);

        if(fetchError) throw fetchError;

        const hasConflict = conflictingAppointments.some(existingApp => {
            if (isRescheduling && existingApp.id === appointmentToReschedule.id) {
                return false;
            }
            const existingAppStartDate = new Date(existingApp.date);
            const existingAppEndDate = addMinutes(existingAppStartDate, existingApp.duration + PREP_TIME);
            // (StartA < EndB) and (EndA > StartB)
            return appointmentDate < existingAppEndDate && appointmentEndDate > existingAppStartDate;
        });

        if (hasConflict) {
            setIsConflictDialogOpen(true);
            setIsSubmitting(false);
            return;
        }

        await clearCurrentLock();

        if (isRescheduling && appointmentToReschedule) {
            const { error } = await supabase.from('appointments').update({
                date: appointmentDate.toISOString(),
            }).eq('id', appointmentToReschedule.id);

            if(error) throw error;
            
            toast({
                title: "Rendez-vous replanifié !",
                description: "Votre rendez-vous a été mis à jour avec succès.",
            });

        } else {
            if (finalPaymentMethod === 'minutes' && user) {
                const currentBalance = userData?.minutes_balance ?? 0;
                const newBalance = currentBalance - selectedDuration;
                await supabase.from('profiles').update({ minutes_balance: newBalance }).eq('id', user.id);
            }

            const { error } = await supabase.from('appointments').insert({
                user_id: userId,
                user_name: userName,
                user_email: userEmail,
                service_name: selectedService.name,
                date: appointmentDate.toISOString(),
                duration: selectedDuration,
                status: 'Confirmado',
                payment_method: finalPaymentMethod,
            });

            if(error) throw error;
        }

        onBookingComplete();

    } catch (error: any) {
        console.error("Error creating/updating appointment: ", error);
        toast({
            variant: "destructive",
            title: "Erreur lors de la planification",
            description: error.message || "Une erreur s'est produite lors du traitement de votre rendez-vous.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const availablePricingTiers = useMemo(() => {
    if (!selectedService) return [];
    return selectedService.pricing_tiers || [];
  }, [selectedService]);

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

   const lockedSlots = useMemo(() => {
    if (!dailyLocks || !user) return {};
    const locks: { [key: string]: 'self' | 'other' } = {};
    const now = new Date();
    dailyLocks.forEach(lock => {
        if (new Date(lock.expires_at) < now) {
            return;
        }

        if (lock.locked_by_user_id === user.id) {
            locks[lock.time] = 'self';
        } else {
            locks[lock.time] = 'other';
        }
    });
    return locks;
  }, [dailyLocks, user]);

  const handleMinutesModalBuy = () => {
    setIsInsufficientMinutesOpen(false);
    onBookingComplete();
    router.push('/#pricing');
  };

  const handleMinutesModalPayOnline = () => {
    setIsInsufficientMinutesOpen(false);
    setPaymentMethod('card');
    // Find the confirmation step and go there
    const confirmationStep = steps.find(s => s.name === 'Confirmation');
    if (confirmationStep) {
        setCurrentStep(confirmationStep.id);
    }
  };


  const renderStepContent = () => {
    const currentStepConfig = steps.find(s => s.id === currentStep);
    if (!currentStepConfig) return null;
    
    switch (currentStepConfig.name) {
      case 'Service':
        if (areServicesLoading) return <div className="grid grid-cols-2 gap-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>;
        return (
          <div className="grid grid-cols-2 gap-4">
            {availableServices.map(service => (
              <Card 
                key={service.id} 
                className={cn("p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted", selectedService?.id === service.id && "ring-2 ring-primary bg-muted")}
                onClick={() => setSelectedService(service)}
              >
                <p className="font-semibold">{service.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
              </Card>
            ))}
             {services?.filter(s => s.is_under_maintenance).map(service => (
              <Card 
                key={service.id} 
                className={cn("p-4 flex flex-col items-center justify-center text-center cursor-not-allowed bg-muted/50 opacity-60")}
              >
                <p className="font-semibold">{service.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                <Badge variant="destructive" className="mt-2"><Wrench className="h-3 w-3 mr-1" />En Maintenance</Badge>
              </Card>
            ))}
          </div>
        );
      case 'Durée':
        return (
          <div className="grid grid-cols-4 gap-4">
            {availablePricingTiers.map(tier => (
                <Card 
                  key={tier.duration} 
                  className={cn("p-4 flex flex-col text-center items-center justify-center cursor-pointer hover:bg-muted", selectedDuration === tier.duration && "ring-2 ring-primary bg-muted")}
                  onClick={() => setSelectedDuration(tier.duration)}
                >
                  <p className="font-semibold">{tier.duration} min</p>
                  {!isSubscribed && (
                    <p className="text-xs text-muted-foreground mt-1">€{tier.price.toFixed(2)}</p>
                  )}
                </Card>
            ))}
          </div>
        );
      case 'Date':
        return (
            <div className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                        clearCurrentLock();
                    }}
                    className="rounded-md border"
                    locale={fr}
                    fromDate={new Date()}
                />
            </div>
        );
      case 'Heure':
        if (areSchedulesLoading || areAppointmentsLoading || areLocksLoading) return <div className="grid grid-cols-4 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        return (
            <div className="grid grid-cols-4 gap-4">
                {availableTimes.length > 0 ? availableTimes.map(time => {
                    const isBusy = busySlots.has(time);
                    const lockStatus = lockedSlots[time];
                    const isDisabled = isBusy || (lockStatus === 'other');

                    let variant: "default" | "outline" | "destructive" = 'outline';
                    if (selectedTime === time || lockStatus === 'self') {
                        variant = 'default';
                    } else if (lockStatus === 'other') {
                        variant = 'destructive';
                    }

                    return (
                        <Button 
                            key={time}
                            variant={variant}
                            onClick={() => handleSelectTime(time)}
                            disabled={isDisabled}
                            className="relative"
                        >
                            {lockStatus === 'other' && <Loader2 className="absolute h-4 w-4 animate-spin" />}
                            <span className={cn(lockStatus === 'other' && 'opacity-0')}>{time}</span>
                        </Button>
                    );
                }) : <p className="col-span-4 text-center text-muted-foreground">Aucun créneau disponible pour ce jour.</p>}
            </div>
        );
      case 'Vos Infos':
        return (
            <FormProvider {...guestForm}>
                <form className="space-y-4">
                    <FormField control={guestForm.control} name="guestName" render={({ field }) => (
                        <FormItem><FormLabel>Nom Complet</FormLabel><FormControl><Input placeholder="Marie Dubois" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={guestForm.control} name="guestEmail" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="marie.dubois@exemple.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={guestForm.control} name="guestPhone" render={({ field }) => (
                        <FormItem><FormLabel>Téléphone (Optionnel)</FormLabel><FormControl><Input placeholder="+33 6 12 34 56 78" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </form>
            </FormProvider>
        );
      case 'Paiement':
        return (
            <div className="space-y-4">
                <h3 className="font-semibold">Choisissez le mode de paiement</h3>
                <Card 
                    className={cn("p-4 flex items-center gap-4 cursor-pointer hover:bg-muted", paymentMethod === 'card' && "ring-2 ring-primary bg-muted")}
                    onClick={() => setPaymentMethod('card')}
                >
                    <CreditCard className="h-6 w-6 text-muted-foreground"/>
                    <p>{paymentMethodLabels.card}</p>
                </Card>
                 <Card 
                    className={cn("p-4 flex items-center gap-4 cursor-pointer hover:bg-muted", paymentMethod === 'reception' && "ring-2 ring-primary bg-muted")}
                    onClick={() => setPaymentMethod('reception')}
                >
                    <Landmark className="h-6 w-6 text-muted-foreground"/>
                    <p>{paymentMethodLabels.reception}</p>
                </Card>
                 <Card 
                    className={cn("p-4 flex items-center gap-4 cursor-not-allowed opacity-50")}
                >
                    <Banknote className="h-6 w-6 text-muted-foreground"/>
                    <div>
                        <p>{paymentMethodLabels.minutes}</p>
                        <p className="text-xs text-muted-foreground">Disponible uniquement pour les abonnés</p>
                    </div>
                </Card>
            </div>
        );
      case 'Confirmation':
        const finalPaymentMethod = isRescheduling ? appointmentToReschedule.payment_method : (isSubscribed ? 'minutes' : paymentMethod);
        const paymentLabel = finalPaymentMethod ? paymentMethodLabels[finalPaymentMethod] : 'N/A';
        const guestInfo = isGuestFlow ? guestForm.getValues() : null;
        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-xl">Résumé du rendez-vous</h3>
                <Card>
                    <CardContent className="p-6 space-y-3">
                       {isGuestFlow && guestInfo && (
                           <div>
                               <p><strong>Nom:</strong> {guestInfo.guestName}</p>
                               <p><strong>Email:</strong> {guestInfo.guestEmail}</p>
                           </div>
                       )}
                       <p><strong>Service:</strong> {selectedService?.name}</p>
                       <p><strong>Durée:</strong> {selectedDuration} minutes</p>
                       <p><strong>Date:</strong> {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: fr }) : 'N/A'}</p>
                       <p><strong>Heure:</strong> {selectedTime}</p>
                       {!isRescheduling && <p><strong>Paiement:</strong> {paymentLabel}</p>}
                       {isRescheduling && <p><strong>Paiement:</strong> Déjà payé via {paymentLabel} (Replanification)</p>}
                    </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground">
                    En confirmant, votre rendez-vous sera {isRescheduling ? 'mis à jour' : 'créé'}. Veuillez vérifier que toutes les informations sont correctes.
                </p>
            </div>
        );
      default:
        return null;
    }
  };

  const nextButtonIsDisabled = () => {
    const currentStepConfig = steps.find(s => s.id === currentStep);
    if (!currentStepConfig) return true;

    switch (currentStepConfig.name) {
        case 'Service': return !selectedService;
        case 'Durée': return !selectedDuration;
        case 'Date': return !selectedDate;
        case 'Heure': return !selectedTime;
        case 'Vos Infos': return !guestForm.formState.isValid;
        case 'Paiement': return !paymentMethod;
        default: return false;
    }
  }

  return (
    <div className="p-4 space-y-6">
      <AlertDialog open={isSlotTaken} onOpenChange={setIsSlotTaken}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Créneau indisponible</AlertDialogTitle>
            <AlertDialogDescription>
              Oups ! Ce créneau vient d'être réservé par un autre utilisateur. Veuillez en choisir un autre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => {
            setIsSlotTaken(false);
            setSelectedTime(null);
          }}>
            J'ai compris
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isConflictDialogOpen} onOpenChange={setIsConflictDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive"/> Conflit d'horaire
            </AlertDialogTitle>
            <AlertDialogDescription>
                Ce service est déjà programmé à une heure qui chevauche votre sélection. Veuillez choisir une heure différente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setIsConflictDialogOpen(false)}>J'ai compris</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isInsufficientMinutesOpen} onOpenChange={setIsInsufficientMinutesOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive"/> Solde de minutes insuffisant
            </AlertDialogTitle>
            <AlertDialogDescription>
               {minutesError} Que souhaitez-vous faire ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction onClick={handleMinutesModalBuy}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Acheter des minutes
            </AlertDialogAction>
            <AlertDialogAction onClick={handleMinutesModalPayOnline} variant="secondary">
                <Wallet className="mr-2 h-4 w-4" /> Payer en ligne
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <div>
        <Progress value={progress} className="w-full h-2" />
        <div className="flex justify-between mt-2">
          {steps.map(step => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs',
                  currentStep > step.id ? 'bg-primary text-primary-foreground' :
                  currentStep === step.id ? 'bg-primary/80 text-primary-foreground ring-2 ring-primary' :
                  'bg-muted text-muted-foreground'
                )}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : (steps.find(s => s.id === step.id)?.name === 'Vos Infos' ? <UserIcon className="h-4 w-4" /> : step.id)}
              </div>
              <p className={cn("text-xs mt-1 text-center", currentStep === step.id && "font-bold")}>{step.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-[250px] p-4 bg-muted/20 rounded-lg flex items-center justify-center">
        {renderStepContent()}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPreviousStep} disabled={currentStep === 1 || isSubmitting}>
          Précédent
        </Button>
        {currentStep < steps.length ? (
          <Button onClick={goToNextStep} disabled={nextButtonIsDisabled()}>
            Suivant
          </Button>
        ) : (
          <Button onClick={handleConfirmBooking} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirmation...
              </>
            ) : isRescheduling ? "Confirmer la replanification" : "Confirmer le rendez-vous"}
          </Button>
        )}
      </div>
    </div>
  );
}
