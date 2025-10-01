
'use client';

import {
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { services } from '@/lib/services';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarOff, Clock, CalendarCheck, CalendarX } from 'lucide-react';

export type UserBooking = {
  id: number;
  date: string;
  time: string;
  service_id: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
  duration: number | null;
};

type UserBookingsProps = {
  bookings: UserBooking[];
};

const getStatusClasses = (status: UserBooking['status']) => {
  switch (status) {
    case 'Confirmado':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Pendente':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Cancelado':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const StatusIcon = ({ status }: { status: UserBooking['status']}) => {
    switch (status) {
        case 'Confirmado':
            return <CalendarCheck className="w-4 h-4" />;
        case 'Cancelado':
            return <CalendarX className="w-4 h-4" />;
        case 'Pendente':
        default:
            return <Clock className="w-4 h-4" />;
    }
}


export function UserBookings({ bookings }: UserBookingsProps) {
  const serviceMap = new Map(services.map((s) => [s.id, s.name]));

  const today = new Date().toISOString().split('T')[0];
  const upcomingBookings = bookings
    .filter((b) => b.date >= today && b.status !== 'Cancelado')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastBookings = bookings
    .filter((b) => b.date < today || b.status === 'Cancelado')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <CardContent className="space-y-8 pt-6">
      {/* Upcoming Bookings */}
      <div>
        <h3 className="text-lg font-headline font-semibold text-primary mb-4">
          Próximos Agendamentos
        </h3>
        {upcomingBookings.length > 0 ? (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => {
              const service = services.find((s) => s.id === booking.service_id);
              return (
                <div key={booking.id} className="p-4 border rounded-lg bg-background flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        {service && <service.icon className="w-8 h-8 text-accent flex-shrink-0" />}
                        <div>
                            <p className="font-semibold text-base">{service?.name || 'Serviço'}</p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(booking.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })} às {booking.time}
                            </p>
                        </div>
                    </div>
                    <Badge className={cn("capitalize text-xs font-medium flex items-center gap-1.5", getStatusClasses(booking.status))}>
                        <StatusIcon status={booking.status} />
                        {booking.status}
                    </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-muted rounded-lg flex flex-col items-center justify-center">
             <CalendarOff className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Nenhum agendamento futuro encontrado.
            </p>
          </div>
        )}
      </div>

      {/* Past Bookings */}
      <div>
        <h3 className="text-lg font-headline font-semibold text-primary mb-4">
          Histórico de Agendamentos
        </h3>
        {pastBookings.length > 0 ? (
          <div className="space-y-4">
             {pastBookings.map((booking) => {
              const service = services.find((s) => s.id === booking.service_id);
              return (
                <div key={booking.id} className="p-4 border rounded-lg bg-background/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 opacity-70">
                    <div className="flex items-center gap-4">
                        {service && <service.icon className="w-8 h-8 text-muted-foreground flex-shrink-0" />}
                        <div>
                            <p className="font-semibold text-base text-muted-foreground">{service?.name || 'Serviço'}</p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(booking.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })} às {booking.time}
                            </p>
                        </div>
                    </div>
                     <Badge className={cn("capitalize text-xs font-medium flex items-center gap-1.5", getStatusClasses(booking.status))}>
                        <StatusIcon status={booking.status} />
                        {booking.status}
                    </Badge>
                </div>
              );
            })}
          </div>
        ) : (
           <div className="text-center py-10 bg-muted rounded-lg flex flex-col items-center justify-center">
            <CalendarOff className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Ainda não há histórico de agendamentos.
            </p>
          </div>
        )}
      </div>
    </CardContent>
  );
}
