
"use client";

import { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

import { type Service } from '@/lib/services';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form } from '@/components/ui/form';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getIcon } from '@/lib/icon-map';

const bookingFormSchema = z.object({
  service: z.custom<Service>().refine((data) => !!data, {
    message: 'Por favor, selecione um serviço.',
  }),
  duration: z.number().min(1, 'Por favor, selecione uma duração.'),
  date: z.date({ required_error: 'Por favor, selecione uma data.' }),
  time: z.string({ required_error: 'Por favor, selecione uma hora.' }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const timeSlots = Array.from({ length: (21 - 7) * 4 }, (_, i) => {
    const totalMinutes = 7 * 60 + i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
});

const steps = [
  { id: 1, name: 'Serviço' },
  { id: 2, name: 'Duração' },
  { id: 3, name: 'Data' },
  { id: 4, name: 'Hora' },
  { id: 5, name: 'Confirmação' },
];

export function BookingForm({
    serviceId: defaultServiceId,
    services,
    onSuccess
}: {
    serviceId?: string,
    services: Service[],
    onSuccess?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>(services);
  
  const defaultService = services.find((s) => s.id === defaultServiceId);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      service: defaultService,
      duration: defaultService?.durations.length === 1 ? defaultService.durations[0] : undefined
    },
  });

  const { watch, setValue, trigger } = form;
  const selectedService = watch('service');
  const selectedDuration = watch('duration');
  const selectedDate = watch('date');
  const selectedTime = watch('time');

  useEffect(() => {
    const fetchUserAndFilterServices = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_plan')
                .eq('id', user.id)
                .single();
            
            const userPlan = profile?.subscription_plan;
            
            if (userPlan && userPlan !== 'Sem Plano') {
                setAvailableServices(services.filter(s => s.allowed_plans?.includes(userPlan)));
            } else {
                 setAvailableServices(services.filter(s => !s.allowed_plans || s.allowed_plans.length === 0));
            }
        } else {
            // User not logged in, show services available for non-subscribed users
            setAvailableServices(services.filter(s => !s.allowed_plans || s.allowed_plans.length === 0));
        }
    };
    
    fetchUserAndFilterServices();
  }, [services]);

  useEffect(() => {
    if (!selectedDate || !selectedService) return;

    const fetchBookedTimes = async () => {
      setIsLoadingTimes(true);
      const supabase = createClient();
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('time')
        .eq('service_id', selectedService.id)
        .eq('date', formattedDate)
        .in('status', ['Confirmado', 'Pendente']);
      
      if (error) {
        console.error('Error fetching booked times:', error);
        toast({
            title: "Erro",
            description: "Não foi possível verificar os horários disponíveis.",
            variant: "destructive"
        })
      } else {
        setBookedTimes(data.map(booking => booking.time));
      }
      setIsLoadingTimes(false);
    };

    fetchBookedTimes();
  }, [selectedDate, selectedService, toast]);


  const progressValue = useMemo(() => {
      return ((currentStep - 1) / (steps.length - 1)) * 100;
  }, [currentStep]);

  useEffect(() => {
      if(defaultService) {
        if (defaultService.durations.length === 1) {
            setCurrentStep(3);
        } else {
            setCurrentStep(2);
        }
      } else {
          setCurrentStep(1);
      }
  }, [defaultService]);

  const handleSelectService = (service: Service) => {
    setValue('service', service);
    trigger('service');
    if (service.durations.length === 1) {
        setValue('duration', service.durations[0]);
        setDirection(1);
        setCurrentStep(3);
    } else {
        setValue('duration', undefined as any);
        setDirection(1);
        setCurrentStep(2);
    }
  };

  const handleSelectDuration = (duration: number) => {
    setValue('duration', duration);
    trigger('duration');
    setDirection(1);
    setCurrentStep(3);
  };
  
  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setValue('date', date);
    trigger('date');
    setValue('time', undefined as any); // Reset time when date changes
    setBookedTimes([]); // Reset booked times
    setDirection(1);
    setCurrentStep(4);
  }

  const handleSelectTime = (time: string) => {
    setValue('time', time);
    trigger('time');
    setDirection(1);
    setCurrentStep(5);
  }

  const prevStep = () => {
    setDirection(-1);
    let targetStep = currentStep - 1;
    // If we are at the date step (3) and the service has only one duration option,
    // going back should skip the duration step (2) and go straight to the service selection (1)
    if (currentStep === 3 && selectedService?.durations.length === 1) {
      targetStep = 1;
    }
    // If a default service was passed, step 1 is skipped, so we can't go back to it
    if (defaultServiceId && targetStep === 1) {
        return;
    }
    setCurrentStep((prev) => (prev > 1 ? targetStep : prev));
  };

  const onSubmit = async (data: BookingFormValues) => {
    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para fazer um agendamento. A redirecionar...',
        variant: 'destructive',
      });
      if (onSuccess) onSuccess();
      router.push('/login?redirect=/');
      return;
    }

    // Check user subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();

    const isSubscribed = profile && profile.subscription_plan && profile.subscription_plan !== 'Sem Plano';
    const bookingStatus = isSubscribed ? 'Confirmado' : 'Pendente';
    const successTitle = isSubscribed ? 'Agendamento Confirmado!' : 'Agendamento Recebido!';
    const successDescription = isSubscribed 
      ? 'O seu agendamento foi confirmado automaticamente. Pode consultá-lo no seu perfil.'
      : 'Seu pedido foi enviado. Em breve você receberá uma confirmação no seu email.';


    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      service_id: data.service.id,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      status: bookingStatus,
      duration: data.duration,
    });
    
    setIsSubmitting(false);

    if (error) {
       toast({
        title: 'Erro no Agendamento',
        description: `Não foi possível criar o seu agendamento: ${error.message}`,
        variant: 'destructive',
      });
      console.error('Error creating booking:', error);
    } else {
      toast({
        title: successTitle,
        description: successDescription,
      });
      if (onSuccess) {
          onSuccess();
      } else {
        router.push('/profile/bookings');
      }
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const isBackButtonDisabled = (currentStep === 1 || (!!defaultServiceId && currentStep === 2) || (!!defaultServiceId && defaultService?.durations.length === 1 && currentStep === 3)) || isSubmitting;


  return (
    <div className="overflow-hidden">
       <div className="p-4 bg-card rounded-t-lg">
         <div className="flex justify-between items-center mb-2">
           <h3 className="font-headline text-lg text-primary">{steps[currentStep-1].name}</h3>
           <span className="text-sm text-muted-foreground">{`Passo ${currentStep} de ${steps.length}`}</span>
         </div>
        <Progress value={progressValue} className="w-full h-2" />
      </div>
      <div className="p-4 bg-card rounded-b-lg">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="relative overflow-hidden h-[22rem] flex items-center justify-center">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'tween', ease: 'easeInOut', duration: 0.5 }}
                    className="absolute w-full h-full"
                  >
                    {currentStep === 1 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {availableServices.map((service) => {
                           const ServiceIcon = getIcon(service.icon);
                           return (
                          <Card
                            key={service.id}
                            className={cn('cursor-pointer transition-all duration-300 hover:shadow-md', {
                                'ring-2 ring-accent border-accent shadow-lg': selectedService?.id === service.id,
                            })}
                            onClick={() => handleSelectService(service)}
                          >
                            <CardContent className="p-4 flex flex-col items-center justify-center gap-3 text-center h-full">
                              <ServiceIcon className="w-10 h-10 text-accent" />
                              <span className="font-semibold text-sm md:text-base">{service.name}</span>
                            </CardContent>
                          </Card>
                        )})}
                      </div>
                    )}
                    {currentStep === 2 && selectedService && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {selectedService.durations.map((duration) => (
                          <Card
                            key={duration}
                            className={cn('cursor-pointer transition-all duration-300 hover:shadow-md', {
                                'ring-2 ring-accent border-accent shadow-lg': selectedDuration === duration,
                            })}
                            onClick={() => handleSelectDuration(duration)}
                          >
                            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center h-full">
                              <Clock className="w-10 h-10 text-accent" />
                              <span className="font-semibold text-2xl">{duration}</span>
                              <span className="text-sm text-muted-foreground">minutos</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                    {currentStep === 3 && (
                       <div className="flex justify-center items-start h-full w-full">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleSelectDate}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            locale={ptBR}
                            numberOfMonths={2}
                            className="rounded-lg border shadow-sm"
                          />
                        </div>
                    )}
                    {currentStep === 4 && (
                      <div>
                        {isLoadingTimes ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                            </div>
                        ) : (
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                              {timeSlots.map(time => {
                                  const isBooked = bookedTimes.includes(time);
                                  return (
                                      <Button
                                          key={time}
                                          type="button"
                                          variant={selectedTime === time ? 'default' : 'outline'}
                                          className={cn('h-14 text-lg', { 
                                              'bg-accent text-accent-foreground ring-2 ring-accent': selectedTime === time,
                                              'disabled:opacity-50 line-through': isBooked,
                                          })}
                                          onClick={() => handleSelectTime(time)}
                                          disabled={isBooked}
                                      >
                                          {time.substring(0,5)}
                                      </Button>
                                  )
                              })}
                          </div>
                        )}
                      </div>
                    )}
                    {currentStep === 5 && (
                      <div className="text-center space-y-6 flex flex-col items-center justify-center h-full">
                        <Check className="w-16 h-16 text-green-500 bg-green-100 rounded-full p-2" />
                        <h2 className="text-2xl md:text-3xl font-bold font-headline text-primary">Confirme o seu Agendamento</h2>
                        <Card className="max-w-md mx-auto text-left w-full shadow-none border">
                          <CardContent className="p-6 space-y-4 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-muted-foreground">Serviço:</span>
                              <span className="font-bold">{selectedService?.name}</span>
                            </div>
                             <div className="flex justify-between items-center">
                              <span className="font-semibold text-muted-foreground">Duração:</span>
                              <span className="font-bold">{selectedDuration} minutos</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-muted-foreground">Data:</span>
                              <span className="font-bold">{selectedDate && format(selectedDate, 'PPP', { locale: ptBR })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-muted-foreground">Hora:</span>
                              <span className="font-bold">{selectedTime?.substring(0,5)}</span>
                            </div>
                          </CardContent>
                        </Card>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">Será enviada uma confirmação por email após a validação do nosso staff.</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex justify-between pt-4 border-t">
                  <Button type="button" variant="outline" onClick={prevStep} disabled={isBackButtonDisabled}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                  </Button>
                  
                  {currentStep === steps.length && (
                      <Button type="submit" disabled={isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}
                      </Button>
                  )}
              </div>
            </form>
        </Form>
      </div>
    </div>
  );
}
