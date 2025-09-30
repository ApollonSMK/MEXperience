"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import { services } from '@/lib/services';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';

const bookingFormSchema = z.object({
  serviceId: z.string({ required_error: 'Por favor, selecione um serviço.' }),
  duration: z.string({ required_error: 'Por favor, selecione uma duração.' }),
  date: z.date({ required_error: 'Por favor, selecione uma data.' }),
  time: z.string({ required_error: 'Por favor, selecione um horário.' }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const availableTimes = [
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

export function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const defaultService = searchParams.get('service') || '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDurations, setAvailableDurations] = useState<number[]>([]);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceId: defaultService,
      duration: '',
    },
  });

  const selectedServiceId = form.watch('serviceId');

  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find((s) => s.id === selectedServiceId);
      setAvailableDurations(service?.durations || []);
      form.resetField('duration');
    } else {
      setAvailableDurations([]);
    }
  }, [selectedServiceId, form]);

  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para fazer um agendamento.',
        variant: 'destructive',
      });
      router.push('/login');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      service_id: data.serviceId,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      status: 'Pendente',
      name: user.user_metadata?.full_name,
      email: user.email,
      duration: parseInt(data.duration, 10),
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
        description: 'Seu pedido foi enviado. Em breve você receberá uma confirmação.',
      });
      router.push('/profile');
    }
  }
  
  const DatePickerButton = ({ field }: { field: any }) => (
     <Button
        variant={'outline'}
        className={cn(
          'w-full justify-start text-left font-normal',
          !field.value && 'text-muted-foreground'
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
      </Button>
  );

  const DatePickerCalendar = ({ field, onDateSelect }: { field: any, onDateSelect?: (date: Date) => void }) => (
     <Calendar
        mode="single"
        selected={field.value}
        onSelect={(date) => {
          if(date) {
            field.onChange(date);
            if (onDateSelect) {
              onDateSelect(date);
            }
          }
        }}
        disabled={(date) =>
          date < new Date(new Date().setHours(0, 0, 0, 0))
        }
        initialFocus
        locale={ptBR}
      />
  );


  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o serviço desejado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração da Sessão</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!selectedServiceId || availableDurations.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={availableDurations.length > 0 ? "Selecione a duração" : "Escolha um serviço primeiro"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableDurations.map((duration) => (
                          <SelectItem key={duration} value={String(duration)}>
                            {duration} minutos
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      {isMobile ? (
                        <Dialog>
                          <FormControl>
                            <DialogTrigger asChild>
                              <DatePickerButton field={field} />
                            </DialogTrigger>
                          </FormControl>
                          <DialogContent className="w-auto sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Selecione a data</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-center">
                               <DatePickerCalendar 
                                field={field} 
                                onDateSelect={() => {
                                   const closeButton = document.querySelector('[data-radix-dialog-close]');
                                   if (closeButton instanceof HTMLElement) {
                                       closeButton.click();
                                   }
                               }} 
                               />
                            </div>
                             <DialogClose asChild>
                                <button data-radix-dialog-close className="hidden">Close</button>
                            </DialogClose>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Popover>
                           <FormControl>
                            <PopoverTrigger asChild>
                                <DatePickerButton field={field} />
                            </PopoverTrigger>
                           </FormControl>
                          <PopoverContent className="w-auto p-0" align="start">
                            <DatePickerCalendar field={field} />
                          </PopoverContent>
                        </Popover>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um horário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTimes.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Aguarde...' : 'Confirmar Agendamento'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
