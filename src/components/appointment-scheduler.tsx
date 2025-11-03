'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, useCollection, useDoc, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, where, Timestamp, serverTimestamp, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, CreditCard, Banknote, Landmark, Loader2, AlertTriangle, Wrench } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { format, getDay, isSameDay, addMinutes, parse, startOfDay, endOfDay, add } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '@/app/profile/appointments/page';
import { Skeleton } from './ui/skeleton';
import type { Service, PricingTier } from '@/app/admin/services/page';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Badge } from './ui/badge';

interface AppointmentSchedulerProps {
  onBookingComplete: () => void;
  appointmentToReschedule?: Appointment | null;
}

interface Schedule {
    id: string;
    dayName: string;
    timeSlots: string[];
    order: number;
}

interface TimeSlotLock {
    id: string;
    serviceId: string;
    date: string;
    time: string;
    lockedByUserId: string;
    expiresAt: Timestamp;
}


const paymentMethodLabels = {
    card: 'Carte de crédit',
    minutes: 'Minutes d\'abonnement',
    reception: 'Payer à la réception',
};

export function AppointmentScheduler({ onBookingComplete, appointmentToReschedule }: AppointmentSchedulerProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<any>(userDocRef);
  const isSubscribed = useMemo(() => !!userData?.planId, [userData]);

  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'services'), orderBy('order'));
  }, [firestore]);
  const { data: services, isLoading: areServicesLoading } = useCollection<Service>(servicesQuery);
  
  const availableServices = useMemo(() => {
    return services?.filter(s => !s.isUnderMaintenance) || [];
  }, [services]);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'schedules'), orderBy('order'));
    }, [firestore]);
  const { data: schedules, isLoading: areSchedulesLoading } = useCollection<Schedule>(schedulesQuery);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const appointmentsForDayQuery = useMemoFirebase(() => {
    if (!firestore || !selectedDate) return null;
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    return query(
      collection(firestore, 'appointments'),
      where('date', '>=', start),
      where('date', '<=', end)
    );
  }, [firestore, selectedDate]);
  
  const { data: dailyAppointments, isLoading: areAppointmentsLoading } = useCollection<Appointment>(appointmentsForDayQuery);

  const locksForDayQuery = useMemoFirebase(() => {
    if (!firestore || !selectedDate) return null;
    return query(
        collection(firestore, 'timeSlotLocks'),
        where('date', '==', format(selectedDate, 'yyyy-MM-dd'))
    );
  }, [firestore, selectedDate]);
  const { data: dailyLocks, isLoading: areLocksLoading } = useCollection<TimeSlotLock>(locksForDayQuery);


  const isRescheduling = !!appointmentToReschedule;

  const steps = useMemo(() => {
    const baseSteps = [
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
        ]
    }
    
    if (!isSubscribed) {
        baseSteps.push({ id: 5, name: 'Paiement' });
    }
    
    baseSteps.push({ id: baseSteps.length + 1, name: 'Confirmation' });

    return baseSteps;
  }, [isSubscribed, isRescheduling]);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof paymentMethodLabels | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlotTaken, setIsSlotTaken] = useState(false);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const activeLockId = useRef<string | null>(null);


 const clearCurrentLock = useCallback(async () => {
    if (activeLockId.current && firestore) {
      const lockIdToDelete = activeLockId.current;
      activeLockId.current = null; // Clear ref immediately
      const lockRef = doc(firestore, 'timeSlotLocks', lockIdToDelete);
      try {
        await deleteDocumentNonBlocking(lockRef);
      } catch (error) {
        console.error('Failed to delete lock:', lockIdToDelete, error);
      }
    }
  }, [firestore]);


  const handleSelectTime = async (time: string) => {
    if (!selectedService || !selectedDate || !user) {
        setSelectedTime(time);
        return;
    }
    
    await clearCurrentLock();

    setSelectedTime(time);

    if (isSubscribed && firestore) {
        const lockRef = doc(collection(firestore, 'timeSlotLocks'));
        const expiresAt = add(new Date(), { minutes: 5 });

        await setDocumentNonBlocking(lockRef, {
            id: lockRef.id,
            serviceId: selectedService.id,
            date: format(selectedDate, 'yyyy-MM-dd'),
            time,
            lockedByUserId: user.uid,
            expiresAt,
        }, {});
        activeLockId.current = lockRef.id;
    }
  };

  useEffect(() => {
    return () => {
      clearCurrentLock();
    };
  }, [clearCurrentLock]);


  useEffect(() => {
    if (appointmentToReschedule && services) {
      const existingService = services.find(s => s.name === appointmentToReschedule.serviceName);
      setSelectedService(existingService || null);
      setSelectedDuration(appointmentToReschedule.duration);
      setSelectedDate(appointmentToReschedule.date.toDate());
      setPaymentMethod(appointmentToReschedule.paymentMethod);
      setCurrentStep(1);
    } else if (!isRescheduling) {
      setSelectedService(null);
      setSelectedDuration(null);
      setSelectedDate(new Date());
      setSelectedTime(null);
      setPaymentMethod(isSubscribed ? 'minutes' : null);
      setCurrentStep(1);
    }
    return () => {
      clearCurrentLock();
    };
  }, [appointmentToReschedule, services, isRescheduling, clearCurrentLock, isSubscribed]);
  

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const goToNextStep = async () => {
    let timeSelectionStep = 4;
    if (isRescheduling) timeSelectionStep = 2;

    if (currentStep === timeSelectionStep && firestore && selectedDate && selectedTime && user) {
        const lockQuery = query(
            collection(firestore, 'timeSlotLocks'),
            where('date', '==', format(selectedDate, 'yyyy-MM-dd')),
            where('time', '==', selectedTime)
        );
        
        const lockSnapshot = await getDocs(lockQuery);
        const conflictingLock = lockSnapshot.docs.find(doc => doc.data().lockedByUserId !== user.uid);

        if (conflictingLock) {
            setIsSlotTaken(true);
            return;
        }
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length))
  };
  const goToPreviousStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleConfirmBooking = async () => {
    if (!user || !firestore || !selectedService || !selectedDuration || !selectedDate || !selectedTime) {
        toast({
            variant: "destructive",
            title: "Erreur de validation",
            description: "Veuillez remplir tous les champs avant de confirmer.",
        });
        return;
    }
    
    setIsSubmitting(true);

    try {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(hours, minutes);
        const appointmentEndDate = addMinutes(appointmentDate, selectedDuration);

        const q = query(
            collection(firestore, 'appointments'),
            where('serviceName', '==', selectedService.name),
            where('date', '<', appointmentEndDate)
        );
        const conflictingDocs = await getDocs(q);
        const hasConflict = conflictingDocs.docs.some(doc => {
            const existingApp = doc.data();
            if (isRescheduling && doc.id === appointmentToReschedule.id) {
                return false;
            }
            const existingAppEnd = addMinutes(existingApp.date.toDate(), existingApp.duration);
            return appointmentDate < existingAppEnd && appointmentEndDate > existingApp.date.toDate();
        });

        if (hasConflict) {
            setIsConflictDialogOpen(true);
            setIsSubmitting(false);
            return;
        }

        await clearCurrentLock();

        if (isRescheduling && appointmentToReschedule) {
            const appointmentRef = doc(firestore, 'appointments', appointmentToReschedule.id);
            await setDocumentNonBlocking(appointmentRef, {
                date: appointmentDate,
            }, { merge: true });
            
            toast({
                title: "Rendez-vous replanifié !",
                description: "Votre rendez-vous a été mis à jour avec succès.",
            });

        } else {
            const finalPaymentMethod = isSubscribed ? 'minutes' : paymentMethod;
            if (!finalPaymentMethod) {
              toast({ variant: "destructive", title: "Erreur de validation", description: "Veuillez sélectionner un mode de paiement." });
              setIsSubmitting(false);
              return;
            }
            
            if (finalPaymentMethod === 'minutes') {
                const currentBalance = userData?.minutesBalance ?? 0;
                if (currentBalance < selectedDuration) {
                    toast({
                        variant: "destructive",
                        title: "Minutes insuffisantes",
                        description: `Vous n'avez pas assez de minutes pour ce rendez-vous de ${selectedDuration} min. Solde actuel : ${currentBalance} min.`,
                    });
                    setIsSubmitting(false);
                    return;
                }
                const newBalance = currentBalance - selectedDuration;
                await setDocumentNonBlocking(userDocRef, { minutesBalance: newBalance }, { merge: true });
            }

            const appointmentRef = doc(collection(firestore, 'appointments'));
            await setDocumentNonBlocking(appointmentRef, {
                id: appointmentRef.id,
                userId: user.uid,
                serviceName: selectedService.name,
                date: appointmentDate,
                duration: selectedDuration,
                status: 'Confirmado',
                paymentMethod: finalPaymentMethod,
            }, {});
            
            toast({
                title: "Rendez-vous confirmé !",
                description: "Votre rendez-vous a été créé avec succès.",
            });
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
    return selectedService.pricingTiers || [];
  }, [selectedService]);

  const availableTimes = useMemo(() => {
    if (!schedules || !selectedDate) return [];
    const dayOfWeek = getDay(selectedDate);
    const scheduleDayIndex = dayOfWeek === 0 ? 7 : dayOfWeek;
    const daySchedule = schedules.find(s => s.order === scheduleDayIndex);
    return daySchedule ? daySchedule.timeSlots : [];
  }, [schedules, selectedDate]);
  
  const busySlots = useMemo(() => {
    if (!dailyAppointments || !selectedService || !selectedDate) return new Set();
    
    const serviceAppointmentsOnDate = dailyAppointments.filter(app => 
        app.status === 'Confirmado' &&
        app.id !== appointmentToReschedule?.id
    );

    const busy = new Set<string>();
    serviceAppointmentsOnDate.forEach(app => {
        const startTime = app.date.toDate();
        const endTime = addMinutes(startTime, app.duration);
        
        availableTimes.forEach(timeSlot => {
            const slotTime = parse(timeSlot, 'HH:mm', selectedDate);
            if(slotTime >= startTime && slotTime < endTime) {
                busy.add(timeSlot);
            }
        });
    });

    return busy;
  }, [dailyAppointments, selectedService, selectedDate, availableTimes, appointmentToReschedule]);

   const lockedSlots = useMemo(() => {
    if (!dailyLocks || !user) return {};
    const locks: { [key: string]: 'self' | 'other' } = {};
    const now = new Date();
    dailyLocks.forEach(lock => {
        if (lock.expiresAt.toDate() < now) {
            return;
        }

        if (lock.lockedByUserId === user.uid) {
            locks[lock.time] = 'self';
        } else {
            locks[lock.time] = 'other';
        }
    });
    return locks;
  }, [dailyLocks, user]);


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
             {services?.filter(s => s.isUnderMaintenance).map(service => (
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
        const finalPaymentMethod = (isSubscribed ? 'minutes' : paymentMethod);
        const paymentLabel = finalPaymentMethod ? paymentMethodLabels[finalPaymentMethod] : 'N/A';
        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-xl">Résumé du rendez-vous</h3>
                <Card>
                    <CardContent className="p-6 space-y-3">
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
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
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
