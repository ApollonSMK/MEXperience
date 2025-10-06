
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ArrowRight, Plus } from 'lucide-react';
import type { Service } from '@/lib/services';
import { format, parse, intervalToDuration, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookingModal } from '../booking-modal';
import { useEffect, useState } from 'react';
import { Progress } from '../ui/progress';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type Booking = {
  id: number;
  date: string;
  time: string;
  service_id: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
};

type BookingsCardProps = {
  upcomingBooking: Booking | undefined;
};

const COUNTDOWN_START_DAYS = 7;

export default function BookingsCard({ upcomingBooking: initialBooking }: BookingsCardProps) {
  const [upcomingBooking, setUpcomingBooking] = useState(initialBooking);
  const [services, setServices] = useState<Service[]>([]);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('a calcular...');

  useEffect(() => {
    setUpcomingBooking(initialBooking);
  }, [initialBooking]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setupRealtime() {
        // 1. Get user first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2. Fetch initial services data
        const { data: servicesData } = await supabase.from('services').select('*');
        if (servicesData) {
            setServices(servicesData as Service[]);
        }

        // 3. Create channel with correct user ID
        channel = supabase
            .channel('realtime-profile-bookings')
            .on(
                'postgres_changes',
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'bookings',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newBooking = payload.new as Booking;
                    const newBookingDate = parse(`${newBooking.date} ${newBooking.time}`, 'yyyy-MM-dd HH:mm:ss', new Date());

                    if (isAfter(newBookingDate, new Date())) {
                        if (!upcomingBooking || isAfter(newBookingDate, parse(`${upcomingBooking.date} ${upcomingBooking.time}`, 'yyyy-MM-dd HH:mm:ss', new Date()))) {
                            setUpcomingBooking(newBooking);
                        }
                    }
                }
            )
            .subscribe();
    }

    setupRealtime();

    return () => {
        if (channel) {
            supabase.removeChannel(channel);
        }
    }

  }, [upcomingBooking]);

  const serviceMap = new Map(services.map((s) => [s.id, s.name]));

  useEffect(() => {
    if (!upcomingBooking) return;

    const calculateCountdown = () => {
      const appointmentDateTime = parse(
        `${upcomingBooking.date} ${upcomingBooking.time}`,
        'yyyy-MM-dd HH:mm:ss',
        new Date()
      );

      if (isNaN(appointmentDateTime.getTime())) {
        console.error("Invalid date format for booking:", upcomingBooking);
        setTimeLeft('Data inválida');
        return;
      }
      
      const now = new Date();

      if (now >= appointmentDateTime) {
        setProgress(100);
        setTimeLeft('Agora');
        return;
      }

      const totalDuration = COUNTDOWN_START_DAYS * 24 * 60 * 60 * 1000;
      const countdownStartDate = new Date(appointmentDateTime.getTime() - totalDuration);
      
      if (now < countdownStartDate) {
        const fullDuration = intervalToDuration({ start: now, end: appointmentDateTime });
        setProgress(0);
        setTimeLeft(`Faltam ${fullDuration.days || 0}d`);
        return;
      }
      
      const timeElapsed = now.getTime() - countdownStartDate.getTime();
      const calculatedProgress = Math.min(100, (timeElapsed / totalDuration) * 100);
      setProgress(calculatedProgress);

      const remainingDuration = intervalToDuration({ start: now, end: appointmentDateTime });
      const { days, hours, minutes, seconds } = remainingDuration;
      let timeString = '';
      if ((days || 0) > 0) timeString += `${days}d `;
      if ((hours || 0) > 0) timeString += `${hours}h `;
      if ((minutes || 0) > 0) timeString += `${minutes}m `;
      if ((seconds || 0) > 0 && (days || 0) === 0) timeString += `${seconds}s`;


      setTimeLeft(timeString.trim());
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [upcomingBooking]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <CalendarIcon className="w-8 h-8 text-accent flex-shrink-0" />
          <div>
            <CardTitle className="font-headline text-xl text-primary">
              Meus Agendamentos
            </CardTitle>
            <CardDescription>
              Veja e gerencie as suas sessões futuras.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingBooking ? (
          <div className="p-4 bg-muted rounded-lg flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="font-semibold">Seu próximo agendamento:</p>
                <p className="text-accent font-bold text-lg">
                  {serviceMap.get(upcomingBooking.service_id) || 'Serviço'}
                </p>
                <p className="text-muted-foreground text-sm">
                  {format(
                    parse(upcomingBooking.date, 'yyyy-MM-dd', new Date()),
                    "EEEE, d 'de' MMMM",
                    { locale: ptBR }
                  )}{' '}
                  às {upcomingBooking.time.substring(0,5)}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <BookingModal services={services}>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agendar Novo
                  </Button>
                </BookingModal>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/profile/bookings">
                    Ver todos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className='space-y-2'>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Contagem decrescente</span>
                  <span className="font-mono">{timeLeft}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-muted rounded-lg">
            <p className="text-muted-foreground mb-4">
              Você não tem agendamentos futuros.
            </p>
            <BookingModal services={services}>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                Agendar um Serviço
              </Button>
            </BookingModal>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
