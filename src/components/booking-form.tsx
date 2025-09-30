
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, ArrowLeft, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

import { services, Service } from '@/lib/services';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';

const bookingFormSchema = z.object({
  service: z.custom<Service>(),
  duration: z.number(),
  date: z.date(),
  time: z.string(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const availableTimes = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

const steps = [
  { id: 1, name: 'Serviço' },
  { id: 2, name: 'Duração' },
  { id: 3, name: 'Data & Hora' },
  { id: 4, name: 'Confirmação' },
];

const Step = ({ step, currentStep }: { step: number; currentStep: number }) => {
  const status =
    currentStep === step
      ? 'active'
      : currentStep < step
      ? 'inactive'
      : 'complete';

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold', {
          'bg-accent text-accent-foreground': status === 'active',
          'bg-primary text-primary-foreground': status === 'complete',
          'bg-muted text-muted-foreground': status === 'inactive',
        })}
      >
        {status === 'complete' ? <Check className="w-5 h-5" /> : step}
      </div>
      <span className={cn("hidden md:block", {
          'text-accent font-bold': status === 'active',
          'text-primary': status === 'complete',
          'text-muted-foreground': status === 'inactive',
      })}>
        {steps[step - 1].name}
      </span>
    </div>
  );
};

export function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  const defaultServiceId = searchParams.get('service');
  const defaultService = services.find(s => s.id === defaultServiceId);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      service: defaultService,
    },
  });

  const { watch, control, trigger, setValue } = form;
  const selectedService = watch('service');
  const selectedDuration = watch('duration');
  const selectedDate = watch('date');
  const selectedTime = watch('time');

  const nextStep = async () => {
    let isValid = false;
    switch(currentStep) {
        case 1:
            isValid = await trigger("service");
            break;
        case 2:
            isValid = await trigger("duration");
            break;
        case 3:
            isValid = await trigger("date") && await trigger("time");
            break;
        default:
            isValid = true;
    }
    
    if (isValid) {
      setDirection(1);
      setCurrentStep((prev) => (prev < steps.length ? prev + 1 : prev));
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));
  };
  
  const onSubmit = async (data: BookingFormValues) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para fazer um agendamento.',
        variant: 'destructive',
      });
      router.push('/login');
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
        description: 'Seu pedido foi enviado. Em breve você receberá uma confirmação.',
      });
      router.push('/profile/bookings');
    }
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-center">
          {steps.map(step => <Step key={step.id} step={step.id} currentStep={currentStep} />)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden h-96">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    className="absolute w-full h-full"
                >
                {currentStep === 1 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {services.map((service) => (
                      <Card
                        key={service.id}
                        className={cn('cursor-pointer transition-all', {
                          'ring-2 ring-accent border-accent': selectedService?.id === service.id,
                        })}
                        onClick={() => setValue('service', service)}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                          <service.icon className="w-8 h-8 text-accent" />
                          <span className="font-semibold text-sm">{service.name}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {currentStep === 2 && selectedService && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedService.durations.map((duration) => (
                      <Card
                        key={duration}
                        className={cn('cursor-pointer transition-all', {
                          'ring-2 ring-accent border-accent': selectedDuration === duration,
                        })}
                        onClick={() => setValue('duration', duration)}
                      >
                         <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                          <Clock className="w-8 h-8 text-accent" />
                          <span className="font-semibold text-lg">{duration}</span>
                           <span className="text-sm text-muted-foreground">minutos</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {currentStep === 3 && (
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="flex flex-col items-center gap-4">
                            <h3 className="font-bold">Escolha o Dia</h3>
                             <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        locale={ptBR}
                                        className="rounded-md border"
                                    />
                                )}
                            />
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <h3 className="font-bold">Escolha a Hora</h3>
                            <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                                {availableTimes.map(time => (
                                    <Button
                                        key={time}
                                        variant={selectedTime === time ? 'default' : 'outline'}
                                        className={cn({ 'bg-accent text-accent-foreground': selectedTime === time})}
                                        onClick={() => setValue('time', time)}
                                    >
                                        {time}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {currentStep === 4 && (
                    <div className="text-center space-y-6">
                        <h2 className="text-2xl font-bold text-primary">Confirme o seu Agendamento</h2>
                        <Card className="max-w-md mx-auto text-left">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Serviço:</span>
                                    <span>{selectedService?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Duração:</span>
                                    <span>{selectedDuration} minutos</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Data:</span>
                                    <span>{selectedDate && format(selectedDate, 'PPP', { locale: ptBR })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Hora:</span>
                                    <span>{selectedTime}</span>
                                </div>
                            </CardContent>
                        </Card>
                         <p className="text-sm text-muted-foreground">Será enviada uma confirmação por email após a validação do nosso staff.</p>
                    </div>
                )}
                </motion.div>
            </AnimatePresence>
        </div>
        <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            {currentStep < steps.length ? (
                <Button onClick={nextStep}>
                    Próximo
                </Button>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                           Confirmar Agendamento
                        </Button>
                    </form>
                </Form>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

    