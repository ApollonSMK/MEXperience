'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, CreditCard, Banknote, Landmark } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { format, getDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '@/app/profile/appointments/page';
import { Skeleton } from './ui/skeleton';
import type { Service, PricingTier } from '@/app/admin/services/page';

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

const paymentMethodLabels = {
    card: 'Cartão de Crédito',
    minutes: 'Minutos da Subscrição',
    reception: 'Pagar na Recepção',
};

export function AppointmentScheduler({ onBookingComplete, appointmentToReschedule }: AppointmentSchedulerProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Fetch user data to check for subscription
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

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'schedules'), orderBy('order'));
    }, [firestore]);
  const { data: schedules, isLoading: areSchedulesLoading } = useCollection<Schedule>(schedulesQuery);

  const isRescheduling = !!appointmentToReschedule;

  const getSteps = () => {
    if (isRescheduling) {
      return [
        { id: 1, name: 'Data' },
        { id: 2, name: 'Hora' },
        { id: 3, name: 'Confirmação' },
      ];
    }
    return [
      { id: 1, name: 'Serviço' },
      { id: 2, name: 'Duração' },
      { id: 3, name: 'Data' },
      { id: 4, name: 'Hora' },
      { id: 5, name: 'Pagamento' },
      { id: 6, name: 'Confirmação' },
    ];
  };

  const [steps, setSteps] = useState(getSteps());
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof paymentMethodLabels | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSteps(getSteps());
    if (appointmentToReschedule && services) {
      const existingService = services.find(s => s.name === appointmentToReschedule.serviceName);
      setSelectedService(existingService || null);
      setSelectedDuration(appointmentToReschedule.duration);
      setSelectedDate(appointmentToReschedule.date.toDate());
      setPaymentMethod(appointmentToReschedule.paymentMethod);
      setCurrentStep(1); // Start at date selection for rescheduling
    } else if (!isRescheduling) {
      // Reset state when not rescheduling
      setSelectedService(null);
      setSelectedDuration(null);
      setSelectedDate(new Date());
      setSelectedTime(null);
      setPaymentMethod(null);
      setCurrentStep(1);
    }
  }, [appointmentToReschedule, services, isRescheduling]);
  

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const goToNextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const goToPreviousStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleConfirmBooking = async () => {
    if (!user || !firestore || !selectedService || !selectedDuration || !selectedDate || !selectedTime) {
        toast({
            variant: "destructive",
            title: "Erro de Validação",
            description: "Por favor, preencha todos os campos antes de confirmar.",
        });
        return;
    }
    
    setIsSubmitting(true);

    try {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(hours, minutes);

        if (isRescheduling && appointmentToReschedule) {
            // Update existing appointment
            const appointmentRef = doc(firestore, 'users', user.uid, 'appointments', appointmentToReschedule.id);
            await setDocumentNonBlocking(appointmentRef, {
                date: appointmentDate,
            }, { merge: true });
            
            toast({
                title: "Agendamento Reagendado!",
                description: "O seu agendamento foi atualizado com sucesso.",
            });

        } else {
            // Create new appointment
            if (!paymentMethod) {
              toast({ variant: "destructive", title: "Erro de Validação", description: "Por favor, selecione um método de pagamento." });
              setIsSubmitting(false);
              return;
            }
            const appointmentRef = doc(collection(firestore, 'users', user.uid, 'appointments'));
            await setDocumentNonBlocking(appointmentRef, {
                id: appointmentRef.id,
                userId: user.uid,
                serviceName: selectedService.name,
                date: appointmentDate,
                duration: selectedDuration,
                status: 'Confirmado',
                paymentMethod: paymentMethod,
            }, {});
            
            toast({
                title: "Agendamento Confirmado!",
                description: "O seu agendamento foi criado com sucesso.",
            });
        }
        
        onBookingComplete();

    } catch (error: any) {
        console.error("Error creating/updating appointment: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Agendar",
            description: error.message || "Ocorreu um erro ao tentar processar o seu agendamento.",
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
    // getDay returns 0 for Sunday, 1 for Monday, etc. Adjust for our order (1=Mon, 7=Sun)
    const dayOfWeek = getDay(selectedDate);
    const scheduleDayIndex = dayOfWeek === 0 ? 7 : dayOfWeek;
    const daySchedule = schedules.find(s => s.order === scheduleDayIndex);
    return daySchedule ? daySchedule.timeSlots : [];
  }, [schedules, selectedDate]);


  const renderStepContent = () => {
    let stepToRender = currentStep;
    if (isRescheduling) {
        if (currentStep === 1) stepToRender = 3; // Date
        if (currentStep === 2) stepToRender = 4; // Time
        if (currentStep === 3) stepToRender = 6; // Confirmation
    }
    
    switch (stepToRender) {
      case 1:
        if (areServicesLoading) return <div className="grid grid-cols-2 gap-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>;
        return (
          <div className="grid grid-cols-2 gap-4">
            {services?.map(service => (
              <Card 
                key={service.id} 
                className={cn("p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted", selectedService?.id === service.id && "ring-2 ring-primary bg-muted")}
                onClick={() => setSelectedService(service)}
              >
                <p className="font-semibold">{service.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
              </Card>
            ))}
          </div>
        );
      case 2:
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
      case 3:
        return (
            <div className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime(null); // Reset time when date changes
                    }}
                    className="rounded-md border"
                    locale={fr}
                    fromDate={new Date()}
                />
            </div>
        );
      case 4:
        if (areSchedulesLoading) return <div className="grid grid-cols-4 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        return (
            <div className="grid grid-cols-4 gap-4">
                {availableTimes.length > 0 ? availableTimes.map(time => (
                    <Button 
                        key={time}
                        variant={selectedTime === time ? 'default' : 'outline'}
                        onClick={() => setSelectedTime(time)}
                    >
                        {time}
                    </Button>
                )) : <p className="col-span-4 text-center text-muted-foreground">Nenhum horário disponível para este dia.</p>}
            </div>
        );
      case 5:
        return (
            <div className="space-y-4">
                <h3 className="font-semibold">Escolha o método de pagamento</h3>
                <Card 
                    className={cn("p-4 flex items-center gap-4 cursor-pointer hover:bg-muted", paymentMethod === 'card' && "ring-2 ring-primary bg-muted")}
                    onClick={() => setPaymentMethod('card')}
                >
                    <CreditCard className="h-6 w-6 text-muted-foreground"/>
                    <p>{paymentMethodLabels.card}</p>
                </Card>
                 <Card 
                    className={cn("p-4 flex items-center gap-4 cursor-pointer hover:bg-muted", paymentMethod === 'minutes' && "ring-2 ring-primary bg-muted", !isSubscribed && "opacity-50 cursor-not-allowed")}
                    onClick={() => isSubscribed && setPaymentMethod('minutes')}
                >
                    <Banknote className="h-6 w-6 text-muted-foreground"/>
                    <div>
                        <p>{paymentMethodLabels.minutes}</p>
                        {!isSubscribed && <p className="text-xs text-muted-foreground">Disponível apenas para subscritores</p>}
                    </div>
                </Card>
                 <Card 
                    className={cn("p-4 flex items-center gap-4 cursor-pointer hover:bg-muted", paymentMethod === 'reception' && "ring-2 ring-primary bg-muted")}
                    onClick={() => setPaymentMethod('reception')}
                >
                    <Landmark className="h-6 w-6 text-muted-foreground"/>
                    <p>{paymentMethodLabels.reception}</p>
                </Card>
            </div>
        );
      case 6:
        const finalPaymentMethod = paymentMethod ? paymentMethodLabels[paymentMethod] : 'N/A';
        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-xl">Resumo do Agendamento</h3>
                <Card>
                    <CardContent className="p-6 space-y-3">
                       <p><strong>Serviço:</strong> {selectedService?.name}</p>
                       <p><strong>Duração:</strong> {selectedDuration} minutos</p>
                       <p><strong>Data:</strong> {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: fr }) : 'N/A'}</p>
                       <p><strong>Hora:</strong> {selectedTime}</p>
                       {!isRescheduling && <p><strong>Pagamento:</strong> {finalPaymentMethod}</p>}
                       {isRescheduling && <p><strong>Pagamento:</strong> Já pago via {finalPaymentMethod} (Reagendamento)</p>}
                    </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground">
                    Ao confirmar, o seu agendamento será {isRescheduling ? 'atualizado' : 'criado'}. Verifique se todas as informações estão corretas.
                </p>
            </div>
        );
      default:
        return null;
    }
  };

  const nextButtonIsDisabled = () => {
    if (isRescheduling) {
        if (currentStep === 1) return !selectedDate;
        if (currentStep === 2) return !selectedTime;
    } else {
        if (currentStep === 1) return !selectedService;
        if (currentStep === 2) return !selectedDuration;
        if (currentStep === 3) return !selectedDate;
        if (currentStep === 4) return !selectedTime;
        if (currentStep === 5) return !paymentMethod;
    }
    return false;
  }

  return (
    <div className="p-4 space-y-6">
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
              <p className={cn("text-xs mt-1", currentStep === step.id && "font-bold")}>{step.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-[250px] p-4 bg-muted/30 rounded-lg flex items-center justify-center">
        {renderStepContent()}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPreviousStep} disabled={currentStep === 1}>
          Anterior
        </Button>
        {currentStep < steps.length ? (
          <Button onClick={goToNextStep} disabled={nextButtonIsDisabled()}>
            Próximo
          </Button>
        ) : (
          <Button onClick={handleConfirmBooking} disabled={isSubmitting}>
            {isSubmitting ? "Confirmando..." : isRescheduling ? "Confirmar Reagendamento" : "Confirmar Agendamento"}
          </Button>
        )}
      </div>
    </div>
  );
}
