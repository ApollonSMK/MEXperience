import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';
import { services } from '@/lib/services';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Booking = {
  id: number;
  date: string;
  time: string;
  service_id: string;
};

type BookingsCardProps = {
  upcomingBooking: Booking | undefined;
};

export default function BookingsCard({ upcomingBooking }: BookingsCardProps) {
  const serviceMap = new Map(services.map((s) => [s.id, s.name]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Calendar className="w-8 h-8 text-accent flex-shrink-0" />
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
          <div className="p-4 bg-muted rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="font-semibold">Seu próximo agendamento:</p>
              <p className="text-accent font-bold text-lg">
                {serviceMap.get(upcomingBooking.service_id) || 'Serviço'}
              </p>
              <p className="text-muted-foreground text-sm">
                {format(new Date(upcomingBooking.date), "EEEE, d 'de' MMMM", { locale: ptBR })} às {upcomingBooking.time}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile/bookings">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-6 px-4 bg-muted rounded-lg">
            <p className="text-muted-foreground mb-4">
              Você não tem agendamentos futuros.
            </p>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/booking">Agendar um Serviço</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
