'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, Loader2, AlertTriangle, Wrench, Calendar as CalendarIcon, ArrowLeft, ChevronRight, ChevronLeft, X, CreditCard, Home, Clock, PlusCircle, Wallet } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { format, getDay, isBefore, parse, addMinutes, differenceInMinutes, isSameDay, addDays, startOfToday, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import type { Service } from '@/app/admin/services/page';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Separator } from './ui/separator';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { ResponsiveDialog } from './responsive-dialog';
import { AuthForm } from './auth-form';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { AppointmentPaymentForm } from './appointment-payment-form';
import Link from 'next/link';
import { Checkbox } from './ui/checkbox';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';


interface Appointment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  service_name: string;
  date: string; // ISO String
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
  payment_method: 'card' | 'minutes' | 'reception';
}

interface AppointmentSchedulerProps {
  onBookingComplete: () => void;
}

interface UserProfile {
    id: string;
    display_name: string | null;
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


export function AppointmentScheduler({ onBookingComplete }: AppointmentSchedulerProps) {
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'minutes' | 'card' | 'reception'>('card');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);


  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const isRescheduling = !!appointmentToReschedule;
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBookingAttempted, setIsBookingAttempted] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInsufficientMinutesOpen, setIsInsufficientMinutesOpen] = useState(false);
  const [minutesError, setMinutesError] = useState('');
  
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (viewportRef.current) {
        const scrollAmount = direction === 'left' ? -300 : 300;
        viewportRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };


  useEffect(() => {
    const rescheduleData = sessionStorage.getItem('rescheduleAppointment');
    if (rescheduleData) {
      setAppointmentToReschedule(JSON.parse(rescheduleData));
      sessionStorage.removeItem('rescheduleAppointment');
    }
  }, []);
  
  // Open mobile summary drawer when a time is selected
  // REMOVED: The useEffect causing auto-open is replaced by explicit handlers for better control
  /* 
  useEffect(() => {
    if (selectedTime && !isDesktop) {
        setIsSummaryOpen(true);
    }
  }, [selectedTime, isDesktop]);
  */
  
  const fetchUserData = useCallback(async (currentUser: User | null): Promise<UserProfile | null> => {
    if (!currentUser || !supabase) {
        setUser(null);
        setUserData(null);
        return null;
    }
    setUser(currentUser);
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('id, display_name, email, plan_id, minutes_balance').eq('id', currentUser.id).single();
    
    if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger les données de l'utilisateur." });
        setUserData(null);
        return null;
    }
    else {
        setUserData(profileData as UserProfile);
        return profileData as UserProfile;
    }
  }, [supabase, toast]);


  // Effect to handle booking after successful login
  useEffect(() => {
    if (user && isBookingAttempted) {
      setIsBookingAttempted(false); // Reset the flag
      handleConfirmBooking(); // Re-trigger the booking
    }
  }, [user, isBookingAttempted]);


  // Fetch initial static data (services, schedules) and user data
  useEffect(() => {
    const fetchInitialData = async () => {
        if (!supabase) return;
        setIsLoading(true);

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        await fetchUserData(currentUser);

        const servicesPromise = supabase.from('services').select('*').order('order');
        const schedulesPromise = supabase.from('schedules').select('*').order('order');
        
        const [
            { data: servicesData, error: servicesError },
            { data: schedulesData, error: schedulesError }
        ] = await Promise.all([servicesPromise, schedulesPromise]);

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

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const freshUser = session?.user ?? null;
            if (event === 'SIGNED_IN') {
              await fetchUserData(freshUser);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setUserData(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };

    };
    fetchInitialData();
  }, [toast, supabase, fetchUserData]);

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
    if (!selectedDate || !supabase) return;
    
    const fetchDynamicData = async () => {
        setAreDetailsLoading(true);
        const start = format(selectedDate, 'yyyy-MM-dd') + 'T00:00:00.000Z';
        const end = format(selectedDate, 'yyyy-MM-dd') + 'T23:59:59.999Z';

        const { data: appointmentsData, error: appointmentsError } = await supabase.from('appointments').select('*').gte('date', start).lte('date', end);

        if (appointmentsError) toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger les rendez-vous du jour." });
        else setDailyAppointments(appointmentsData as Appointment[] || []);
        
        setAreDetailsLoading(false);
    };

    fetchDynamicData();
  }, [selectedDate, toast, supabase]);

   useEffect(() => {
    if (selectedDate && selectedDate.getMonth() !== currentMonth.getMonth()) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate, currentMonth]);

    const handleDaysScroll = useCallback(() => {
        if (!viewportRef.current) return;
        const viewport = viewportRef.current;
        let mostVisibleDay: Date | null = null;
        let maxVisibleWidth = 0;

        const dayElements = Array.from(viewport.querySelectorAll('[data-date]'));

        for (const dayElement of dayElements) {
            const rect = dayElement.getBoundingClientRect();
            const viewportRect = viewport.getBoundingClientRect();

            // Calculate the visible width of the element within the viewport
            const visibleWidth = Math.min(rect.right, viewportRect.right) - Math.max(rect.left, viewportRect.left);

            if (visibleWidth > maxVisibleWidth) {
                maxVisibleWidth = visibleWidth;
                const dateStr = dayElement.getAttribute('data-date');
                if (dateStr) {
                    mostVisibleDay = new Date(dateStr);
                }
            }
        }

        if (mostVisibleDay && mostVisibleDay.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(mostVisibleDay);
        }
    }, [currentMonth]);


  const selectedService = useMemo(() => services.find(s => s.id === activeServiceId), [services, activeServiceId]);
  const availableServices = useMemo(() => services?.filter(s => !s.is_under_maintenance) || [], [services]);
  const isSubscribed = useMemo(() => !!userData?.plan_id, [userData]);

  const handleSelectDuration = (duration: number, price: number) => {
    setSelectedDuration(duration);
    setSelectedPrice(price);
    setSelectedTime(null);
    if (!isDesktop) {
        setIsSummaryOpen(true);
    }
  }
  
  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    if (!isDesktop) {
        setIsSummaryOpen(true);
    }
  };
  
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
      const busy = new Set<string>();
      if (!dailyAppointments || !selectedDate || !allAvailableTimes.length || !selectedService) return busy;
      
      const appointmentsOnDateForService = dailyAppointments.filter(app => 
        app.status === 'Confirmado' && 
        app.service_name === selectedService.name &&
        app.id !== appointmentToReschedule?.id
      );
  
      allAvailableTimes.forEach(time => {
          const slotStart = parse(time, 'HH:mm', selectedDate);
          const slotEnd = addMinutes(slotStart, timeSlotInterval);
  
          for (const app of appointmentsOnDateForService) {
              const appointmentStart = new Date(app.date);
              const appointmentEnd = addMinutes(appointmentStart, app.duration);
              
              // Check for overlap: (StartA < EndB) and (EndA > StartB)
              if (appointmentStart < slotEnd && appointmentEnd > slotStart) {
                  busy.add(time);
                  break; 
              }
          }
      });
  
      return busy;
    }, [dailyAppointments, selectedDate, allAvailableTimes, timeSlotInterval, selectedService, appointmentToReschedule]);

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
    if (!selectedService || !selectedDuration || !selectedDate || !selectedTime || selectedPrice === null) {
        toast({ variant: 'destructive', title: 'Informations manquantes', description: 'Veuillez compléter toutes les étapes.' });
        return;
    }

    if (!user || !userData) {
        setIsBookingAttempted(true);
        setIsAuthModalOpen(true);
        return;
    }

    setIsSubmitting(true);

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes);

    try {
        if (isRescheduling && appointmentToReschedule) {
            const { data, error } = await supabase
                .from('appointments')
                .update({ date: appointmentDate.toISOString() })
                .eq('id', appointmentToReschedule.id)
                .select()
                .single();
            if (error) throw error;
            
            // --- EMAIL NOTIFICATION (RESCHEDULE) ---
            await fetch('/api/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'reschedule',
                    to: userData.email,
                    data: {
                        userName: userData.display_name || userData.email,
                        serviceName: selectedService.name,
                        date: appointmentDate.toISOString(),
                        duration: selectedDuration
                    }
                })
            });
            // ---------------------------------------

            toast({ title: 'Rendez-vous replanifié !', description: 'Votre rendez-vous a été mis à jour avec succès.' });
            onBookingComplete();
            return;
        }

        let actualPaymentMethod: 'card' | 'minutes' | 'reception' = paymentMethod;

        if (isSubscribed) {
            const currentBalance = userData.minutes_balance ?? 0;
            if (currentBalance >= selectedDuration) {
                actualPaymentMethod = 'minutes';
            } else {
                 setMinutesError(`Vous avez ${currentBalance} minutes, mais ce soin en requiert ${selectedDuration}.`);
                 setIsInsufficientMinutesOpen(true);
                 setIsSubmitting(false);
                 return;
            }
        }
        
        if (actualPaymentMethod === 'card') {
            const response = await fetch('/api/stripe/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    serviceId: selectedService.id,
                    serviceName: selectedService.name,
                    price: selectedPrice,
                    userId: user.id,
                    userName: userData.display_name || userData.email,
                    userEmail: userData.email,
                    appointmentDate: appointmentDate.toISOString(),
                    duration: selectedDuration,
                    paymentMethod: 'card',
                }),
            });
            const { clientSecret: secret, error: intentError } = await response.json();
            if (intentError) throw new Error(intentError);
            setClientSecret(secret);
            setIsPaymentModalOpen(true);
            
        } else { // For 'minutes' or 'reception' payments, confirm directly
             const { data: newAppointment, error: insertError } = await supabase
                .from('appointments')
                .insert({
                    user_id: user.id,
                    user_name: userData.display_name || userData.email,
                    user_email: userData.email,
                    service_name: selectedService.name,
                    date: appointmentDate.toISOString(),
                    duration: selectedDuration,
                    status: 'Confirmado',
                    payment_method: actualPaymentMethod,
                })
                .select()
                .single();
            if (insertError) throw insertError;
            
            if (actualPaymentMethod === 'minutes') {
                const newBalance = (userData.minutes_balance ?? 0) - selectedDuration;
                const { error: profileUpdateError } = await supabase.from('profiles').update({ minutes_balance: newBalance }).eq('id', user.id);
                if (profileUpdateError) console.error("Failed to update user minutes balance:", profileUpdateError.message);
            }

            // --- EMAIL NOTIFICATION (CONFIRMATION - Minutes/Reception) ---
            console.log("Tentando enviar e-mail de confirmação (Minutes/Reception)...");
            const emailPayload = {
                type: 'confirmation',
                to: userData.email,
                data: {
                    userName: userData.display_name || userData.email,
                    serviceName: selectedService.name,
                    date: appointmentDate.toISOString(),
                    duration: selectedDuration
                }
            };
            console.log("Payload do e-mail:", emailPayload);

            try {
                const emailRes = await fetch('/api/emails/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emailPayload)
                });
                
                if (!emailRes.ok) {
                    const errorText = await emailRes.text();
                    console.error("Falha no envio de e-mail (API response):", emailRes.status, errorText);
                } else {
                    const result = await emailRes.json();
                    console.log("E-mail enviado com sucesso (API result):", result);
                }
            } catch (emailErr) {
                 console.error("Erro na chamada fetch do e-mail:", emailErr);
            }
            // -----------------------------------------------------------

            toast({ title: 'Rendez-vous confirmé !', description: 'Votre rendez-vous a été ajouté avec succès.' });
            onBookingComplete();
        }

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur de Planification', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
};

  const handleInsufficientMinutesChoice = async (choice: 'reception' | 'buy') => {
        setIsInsufficientMinutesOpen(false);
        if (choice === 'buy') {
            router.push('/profile/buy-minutes');
            return;
        }
        
        setPaymentMethod('reception');
        setTimeout(() => handleConfirmBooking(), 100);
  };

  const handleSuccessfulPayment = async (paymentIntentId: string) => {
    setIsPaymentModalOpen(false);

    // Call the secure API endpoint to finalize the invoice creation
    const response = await fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
    });

    if (!response.ok) {
        const { error: invoiceError, dataSent } = await response.json();
        console.error("Error creating appointment invoice:", invoiceError, "Data sent:", dataSent);
        // This is not a critical error for the user at this moment. The appointment is booked.
        toast({ variant: "default", title: "Note", description: "Votre facture sera générée sous peu." });
    }
    
    // Create the appointment in the database now that payment is confirmed
    if (!selectedService || !selectedDuration || !selectedDate || !selectedTime || !user || !userData) return;
    
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes);

    const { error } = await supabase.from('appointments').insert({
        user_id: user.id,
        user_name: userData.display_name || userData.email,
        user_email: userData.email,
        service_name: selectedService.name,
        date: appointmentDate.toISOString(),
        duration: selectedDuration,
        status: 'Confirmado',
        payment_method: 'card',
    });

    if (error) {
        toast({ variant: 'destructive', title: 'Erreur de Confirmation', description: 'Le paiement a réussi, mais nous n\'avons pas pu enregistrer votre rendez-vous. Veuillez nous contacter.' });
        return;
    } 

    // --- EMAIL NOTIFICATION (CONFIRMATION - Card) ---
    console.log("Tentando enviar e-mail de confirmação (Card)...");
    const emailPayloadCard = {
        type: 'confirmation',
        to: userData.email,
        data: {
            userName: userData.display_name || userData.email,
            serviceName: selectedService.name,
            date: appointmentDate.toISOString(),
            duration: selectedDuration
        }
    };
    console.log("Payload do e-mail (Card):", emailPayloadCard);

    try {
        const emailRes = await fetch('/api/emails/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayloadCard)
        });

        if (!emailRes.ok) {
            const errorText = await emailRes.text();
            console.error("Falha no envio de e-mail (Card) - API response:", emailRes.status, errorText);
        } else {
            const result = await emailRes.json();
            console.log("E-mail (Card) enviado com sucesso:", result);
        }
    } catch (emailErr) {
        console.error("Erro na chamada fetch do e-mail (Card):", emailErr);
    }
    // ------------------------------------------------

    toast({ title: 'Rendez-vous confirmé !', description: 'Votre paiement et votre rendez-vous ont été confirmés.' });
    onBookingComplete();
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
    setIsSummaryOpen(false);
  }
  
  const handleAuthSuccess = (didLogin: boolean) => {
    setIsAuthModalOpen(false);
    if(didLogin) {
      setIsBookingAttempted(true); // Flag that we should try booking on next user state change
    } else {
      setIsBookingAttempted(false);
    }
  };

  const today = startOfToday();
  const futureDays = eachDayOfInterval({
    start: today,
    end: addDays(today, 90),
  });

  const SummaryContent = () => (
    <>
        <CardHeader>
            <CardTitle>M.E Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <Separator/>
            {selectedService && selectedDuration && selectedPrice !== null ? (
                <div>
                <div className="flex justify-between items-center py-2">
                    <div>
                        <p className="font-semibold">{selectedService.name}</p>
                    </div>
                    <p className="font-semibold">
                        {isRescheduling 
                            ? '€0.00' 
                            : isSubscribed 
                                ? `${selectedDuration} min` 
                                : `€${(selectedPrice || 0).toFixed(2)}`
                        }
                    </p>
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
                    
                {!isSubscribed && !isRescheduling && step === 'select_date_time' && (
                    <div className="pt-4">
                        <Separator className="mb-4"/>
                        <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'minutes' | 'card' | 'reception')}>
                        <Label className="font-semibold">Options de Paiement</Label>
                        <div className="space-y-3 mt-2">
                                <Label htmlFor="online" className="flex items-center gap-3 cursor-pointer rounded-md border p-3 has-[[data-state=checked]]:border-primary">
                                <RadioGroupItem value="card" id="online" />
                                <CreditCard className="h-5 w-5" />
                                <span>Payer en ligne</span>
                            </Label>
                            <Label htmlFor="reception" className="flex items-center gap-3 cursor-pointer rounded-md border p-3 has-[[data-state=checked]]:border-primary">
                                <RadioGroupItem value="reception" id="reception" />
                                <Home className="h-5 w-5" />
                                <span>Payer à la réception</span>
                            </Label>
                        </div>
                        </RadioGroup>
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
                <p>
                    {isRescheduling 
                        ? '€0.00' 
                        : isSubscribed 
                            ? `${selectedDuration || 0} min` 
                            : `€${(selectedPrice || 0).toFixed(2)}`
                    }
                </p>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 items-start pb-6">
            {step === 'select_service' ? (
                <Button 
                    className="w-full"
                    size="lg"
                    disabled={!selectedDuration}
                    onClick={handleGoToNextStep}
                >
                    Continuer
                </Button>
            ) : (
                <>
                    <div className="items-top flex space-x-2">
                        <Checkbox id="terms1" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} />
                        <div className="grid gap-1.5 leading-none">
                            <label
                            htmlFor="terms1"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                            J'ai lu et j'accepte les{' '}
                            <Link href="/termos-de-responsabilidade" target="_blank" className="underline hover:text-primary">
                                termes de responsabilité
                            </Link>
                            .
                            </label>
                        </div>
                    </div>
                    <Button 
                        className="w-full"
                        size="lg"
                        disabled={!selectedTime || isSubmitting || !agreedToTerms}
                        onClick={handleConfirmBooking}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isRescheduling ? 'Confirmer la Replanification' 
                            : !isSubscribed && paymentMethod === 'card' ? 'Continuer vers le paiement' 
                            : 'Confirmer la Réservation'
                        }
                    </Button>
                </>
            )}
        </CardFooter>
    </>
  );

  return (
    <>
      <AlertDialog open={isInsufficientMinutesOpen} onOpenChange={setIsInsufficientMinutesOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-2">
                <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl">Solde insuffisant</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
               Votre solde de minutes ne couvre pas la totalité de ce soin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-lg border border-dashed">
                <span className="text-xs text-muted-foreground uppercase font-semibold mb-1">Votre Solde</span>
                <span className="text-2xl font-bold text-orange-600">{userData?.minutes_balance || 0} min</span>
            </div>
             <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-lg border">
                <span className="text-xs text-muted-foreground uppercase font-semibold mb-1">Coût du soin</span>
                <span className="text-2xl font-bold">{selectedDuration} min</span>
            </div>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-col gap-2 space-x-0">
             <Button 
                onClick={() => handleInsufficientMinutesChoice('buy')} 
                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:from-orange-600 hover:to-pink-700 border-0"
                size="lg"
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Acheter un pack de minutes
            </Button>
             
             <Button 
                onClick={() => handleInsufficientMinutesChoice('reception')} 
                variant="outline" 
                className="w-full"
                size="lg"
            >
                <Wallet className="mr-2 h-4 w-4" /> Payer cette séance sur place
            </Button>
            
            <Button 
                variant="ghost" 
                onClick={() => setIsInsufficientMinutesOpen(false)}
                className="w-full text-muted-foreground mt-2"
                size="sm"
            >
                Annuler
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <ResponsiveDialog
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        title="Connectez-vous pour continuer"
        description="Créez un compte ou connectez-vous pour finaliser votre réservation."
      >
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      </ResponsiveDialog>
      
      <ResponsiveDialog
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        title="Finaliser le Paiement"
        description="Veuillez saisir vos informations de paiement pour confirmer votre rendez-vous."
      >
        {clientSecret && (
            <Elements stripe={loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!)} options={{ clientSecret }}>
                <AppointmentPaymentForm onPaymentSuccess={handleSuccessfulPayment} price={selectedPrice || 0} />
            </Elements>
        )}
      </ResponsiveDialog>

      {/* Mobile Drawer for Summary */}
        {!isDesktop && (
            <Drawer open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
                <DrawerContent>
                     <div className="max-h-[85vh] overflow-y-auto">
                        <SummaryContent />
                     </div>
                </DrawerContent>
            </Drawer>
        )}

        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                 {step === 'select_date_time' && (
                    <Button variant="ghost" size="icon" onClick={() => setStep('select_service')}>
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Retour</span>
                    </Button>
                )}
                <span className={cn("text-sm font-semibold", step === 'select_service' ? "text-primary" : "text-muted-foreground")}>
                    1. Prestations
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className={cn("text-sm font-semibold", step === 'select_date_time' ? "text-primary" : "text-muted-foreground")}>
                    2. Heure
                </span>
            </div>
             <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <X className="h-5 w-5" />
                <span className="sr-only">Fermer</span>
            </Button>
        </div>
        
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* --- Main Content --- */}
        <div className="lg:col-span-2 space-y-8">
            
            {step === 'select_service' && (
              <div className="space-y-8 animate-in fade-in-0 duration-300">
                <div className="relative">
                    <ScrollArea className="w-full whitespace-nowrap pb-2">
                        <div className="flex space-x-2 pb-2">
                        {availableServices.map(service => (
                            <Button
                                key={service.id}
                                variant={activeServiceId === service.id ? "default" : "outline"}
                                className={cn(
                                "shrink-0 font-bold rounded-full",
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
                        <ScrollBar orientation="horizontal" />
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
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="relative">
                           <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-card to-transparent pointer-events-none z-10" />
                           <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none z-10" />
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="shrink-0 z-20" onClick={() => handleScroll('left')}><ChevronLeft className="h-4 w-4" /></Button>
                                <ScrollArea className="w-full whitespace-nowrap" viewportRef={viewportRef} onScroll={handleDaysScroll}>
                                    <div className="flex space-x-2 pb-4">
                                        {futureDays.map(day => {
                                            const isDaySelected = selectedDate ? isSameDay(day, selectedDate) : false;
                                            
                                            return (
                                                <div 
                                                    key={day.toISOString()}
                                                    data-date={day.toISOString()}
                                                    onClick={() => {
                                                        setSelectedDate(day);
                                                        setSelectedTime(null);
                                                    }}
                                                    className={cn(
                                                        "flex flex-col items-center justify-start text-center gap-2 cursor-pointer p-1 rounded-md transition-colors w-14 shrink-0",
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex items-center justify-center h-10 w-10 rounded-full border transition-colors",
                                                        isDaySelected ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
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
                                <Button variant="outline" size="icon" className="shrink-0 z-20" onClick={() => handleScroll('right')}><ChevronRight className="h-4 w-4" /></Button>
                           </div>
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
                                        onClick={() => handleSelectTime(time)}
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

        {/* --- Summary Column (Desktop Only) --- */}
        <div className="hidden lg:block lg:col-span-1 h-full">
            <Card className="sticky top-24">
                <SummaryContent />
            </Card>
        </div>
      </div>
    </>
  );
}