'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, CreditCard, Banknote, Landmark } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '@/app/profile/appointments/page';

interface AppointmentSchedulerProps {
  onBookingComplete: () => void;
  appointmentToReschedule?: Appointment | null;
}

const services = [
  'Hydromassage',
  'Collagen Boost',
  'Dôme Infrarouge',
  'Banc Solaire',
];

const durations = [15, 30, 45, 60];

const times = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

export function AppointmentScheduler({ onBookingComplete, appointmentToReschedule }: AppointmentSchedulerProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

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
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSteps(getSteps());
    if (appointmentToReschedule) {
      setSelectedService(appointmentToReschedule.serviceName);
      setSelectedDuration(appointmentToReschedule.duration);
      setSelectedDate(appointmentToReschedule.date.toDate());
      setCurrentStep(1); // Start at date selection
    } else {
      // Reset state when not rescheduling
      setSelectedService(null);
      setSelectedDuration(null);
      setSelectedDate(new Date());
      setSelectedTime(null);
      setPaymentMethod(null);
      setCurrentStep(1);
    }
  }, [appointmentToReschedule]);
  

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const goToNextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const goToPreviousStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const canGoToNext = () => {
    const stepToCheck = isRescheduling ? currentStep + 2 : currentStep;
    switch (stepToCheck) {
        case 1: return !!selectedService;
        case 2: return !!selectedDuration;
        case 3: return !!selectedDate;
        case 4: return !!selectedTime;
        case 5: return !!paymentMethod || isRescheduling; // Payment not needed for reschedule
        default: return true;
    }
  }

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
            const appointmentsColRef = collection(firestore, 'users', user.uid, 'appointments');
            await addDocumentNonBlocking(appointmentsColRef, {
                userId: user.uid,
                serviceName: selectedService,
                date: appointmentDate,
                duration: selectedDuration,
                status: 'Confirmado',
            });
            
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

  const renderStepContent = () => {
    const stepToRender = isRescheduling ? currentStep + 2 : currentStep;
    switch (stepToRender) {
      case 1:
        return (
          <div className="grid grid-cols-2 gap-4">
            {services.map(service => (
              <Card 
                key={service} 
                className={cn("p-4 flex items-center justify-center cursor-pointer hover:bg-muted", selectedService === service && "ring-2 ring-primary bg-muted")}
                onClick={() => setSelectedService(service)}
              >
                <p className="font-semibold text-center">{service}</p>
              </Card>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-4 gap-4">
            {durations.map(duration => (
              <Card 
                key={duration} 
                className={cn("p-4 flex items-center justify-center cursor-pointer hover:bg-muted", selectedDuration === duration && "ring-2 ring-primary bg-muted")}
                onClick={() => setSelectedDuration(duration)}
              >
                <p className="font-semibold">{duration} min</p>
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
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    locale={fr}
                    fromDate={new Date()}
                />
            </div>
        );
      case 4:
        return (
            <div className="grid grid-cols-4 gap-4">
                {times.map(time => (
                    <Button 
                        key={time}
                        variant={selectedTime === time ? 'default' : 'outline'}
                        onClick={() => setSelectedTime(time)}
                    >
                        {time}
                    </Button>
                ))}
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
                    <p>Cartão de Crédito</p>
                </Card>
                 <Card 
                    className={cn("p-4 flex items-center gap-4 cursor-pointer hover:bg-muted", paymentMethod === 'minutes' && "ring-2 ring-primary bg-muted")}
                    onClick={() => setPaymentMethod('minutes')}
                >
                    <Banknote className="h-6 w-6 text-muted-foreground"/>
                    <p>Usar meus minutos</p>
                </Card>
                 <Card 
                    className={cn("p-4 flex items-center gap-4 cursor-pointer hover:bg-muted", paymentMethod === 'reception' && "ring-2 ring-primary bg-muted")}
                    onClick={() => setPaymentMethod('reception')}
                >
                    <Landmark className="h-6 w-6 text-muted-foreground"/>
                    <p>Pagar na recepção</p>
                </Card>
            </div>
        );
      case 6:
        const summaryPayment = isRescheduling ? "Já pago (reagendamento)" : paymentMethod;
        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-xl">Resumo do Agendamento</h3>
                <Card>
                    <CardContent className="p-6 space-y-3">
                       <p><strong>Serviço:</strong> {selectedService}</p>
                       <p><strong>Duração:</strong> {selectedDuration} minutos</p>
                       <p><strong>Data:</strong> {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: fr }) : 'N/A'}</p>
                       <p><strong>Hora:</strong> {selectedTime}</p>
                       <p><strong>Pagamento:</strong> {summaryPayment}</p>
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
          <Button onClick={goToNextStep} disabled={!canGoToNext()}>
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
