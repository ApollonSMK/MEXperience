
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

import { services, Service } from '@/lib/services';
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

const bookingFormSchema = z.object({
  service: z.custom<Service>().refine((data) => !!data, {
    message: 'Por favor, selecione um serviço.',
  }),
  duration: z.number().min(1, 'Por favor, selecione uma duração.'),
  date: z.date({ required_error: 'Por favor, selecione uma data.' }),
  time: z.string({ required_error: 'Por favor, selecione uma hora.' }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const availableTimes = [
  '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
];

const steps = [
  { id: 1, name: 'Serviço' },
  { id: 2, name: 'Duração' },
  { id: 3, name: 'Data' },
  { id: 4, name: 'Hora' },
  { id: 5, name: 'Confirmação' },
];

export function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultServiceId = searchParams.get('service');
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
    if (selectedService?.durations.length === 1 && currentStep === 3) {
      targetStep = 1;
    }
    setCurrentStep((prev) => (prev > 1 ? targetStep : prev));
  };

  const onSubmit = async (data: BookingFormValues) => {
    setIsSubmitting(true);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para fazer um agendamento. A redirecionar...',
        variant: 'destructive',
      });
      router.push('/login?redirect=/booking');
      return;
    }

    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      service_id: data.service.id,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      status: 'Pendente',
      name: user.user_metadata?.full_name,
      email: user.email,
      duration: data.duration,
    });
    
    setIsSubmitting(false);

    if (error) {
       toast({
        title: 'Erro no Agendamento',
        description: 'Não foi possível criar o seu agendamento. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error creating booking:', error);
    } else {
      toast({
        title: 'Agendamento Recebido!',
        description: 'Seu pedido foi enviado. Em breve você receberá uma confirmação no seu email.',
      });
      router.push('/profile');
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

  return (
    <Card className="overflow-hidden shadow-lg">
      <div className="p-6 border-b">
         <div className="flex justify-between items-center mb-2">
           <h3 className="font-headline text-lg text-primary">{steps[currentStep-1].name}</h3>
           <span className="text-sm text-muted-foreground">{`Passo ${currentStep} de ${steps.length}`}</span>
         </div>
        <Progress value={progressValue} className="w-full h-2" />
      </div>
      <CardContent className="p-6 md:p-8">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="relative overflow-hidden h-[24rem] flex items-center justify-center">
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
                        {services.map((service) => (
                          <Card
                            key={service.id}
                            className={cn('cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1', {
                                'ring-2 ring-accent border-accent shadow-lg': selectedService?.id === service.id,
                            })}
                            onClick={() => handleSelectService(service)}
                          >
                            <CardContent className="p-4 flex flex-col items-center justify-center gap-3 text-center h-full">
                              <service.icon className="w-10 h-10 text-accent" />
                              <span className="font-semibold text-sm md:text-base">{service.name}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                    {currentStep === 2 && selectedService && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {selectedService.durations.map((duration) => (
                          <Card
                            key={duration}
                            className={cn('cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1', {
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
                            className="p-0"
                            classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                                month: "space-y-4 w-full",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex justify-between",
                                row: "flex w-full mt-2 justify-between",
                            }}
                          />
                        </div>
                    )}
                    {currentStep === 4 && (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                          {availableTimes.map(time => (
                              <Button
                                  key={time}
                                  type="button"
                                  variant={selectedTime === time ? 'default' : 'outline'}
                                  className={cn('h-14 text-lg', { 'bg-accent text-accent-foreground ring-2 ring-accent': selectedTime === time})}
                                  onClick={() => handleSelectTime(time)}
                              >
                                  {time}
                              </Button>
                          ))}
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
                              <span className="font-bold">{selectedTime}</span>
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
                  <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1 || isSubmitting}>
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
      </CardContent>
    </Card>
  );
}

    