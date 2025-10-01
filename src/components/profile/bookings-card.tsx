
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
import { services } from '@/lib/services';
import { format, formatDistanceToNowStrict, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookingModal } from '../booking-modal';
import { useEffect, useState } from 'react';
import { Progress } from '../ui/progress';

type Booking = {
  id: number;
  date: string;
  time: string;
  service_id: string;
};

type BookingsCardProps = {
  upcomingBooking: Booking | undefined;
};

const COUNTDOWN_START_DAYS = 7;

export default function BookingsCard({ upcomingBooking }: BookingsCardProps) {
  const serviceMap = new Map(services.map((s) => [s.id, s.name]));
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!upcomingBooking) return;

    const calculateProgress = () => {
      const appointmentDateTime = parse(
        `${upcomingBooking.date} ${upcomingBooking.time}`,
        'yyyy-MM-dd HH:mm',
        new Date()
      );
      const now = new Date();
      
      const totalDuration = COUNTDOWN_START_DAYS * 24 * 60 * 60 * 1000; // 7 days in ms
      const countdownStartDate = new Date(appointmentDateTime.getTime() - totalDuration);

      if (now < countdownStartDate) {
        setProgress(0);
        setTimeLeft(formatDistanceToNowStrict(appointmentDateTime, { locale: ptBR, unit: 'day' }));
        return;
      }
      
      if (now >= appointmentDateTime) {
        setProgress(100);
        setTimeLeft('Agora');
        return;
      }

      const timeElapsed = now.getTime() - countdownStartDate.getTime();
      const calculatedProgress = Math.min(100, (timeElapsed / totalDuration) * 100);
      
      setProgress(calculatedProgress);
      setTimeLeft(formatDistanceToNowStrict(appointmentDateTime, { locale: ptBR, addSuffix: true }));
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 60000); // Update every minute

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
                    new Date(upcomingBooking.date),
                    "EEEE, d 'de' MMMM",
                    { locale: ptBR }
                  )}{' '}
                  às {upcomingBooking.time}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <BookingModal>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agendar Novo
                  </Button>
                </BookingModal>
                <Button asChild variant="outline" size="sm">
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
                  <span>{timeLeft}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-muted rounded-lg">
            <p className="text-muted-foreground mb-4">
              Você não tem agendamentos futuros.
            </p>
            <BookingModal>
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
