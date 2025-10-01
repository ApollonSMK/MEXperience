
'use client';

import * as React from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { services } from '@/lib/services';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Booking } from '@/app/admin/bookings/page';
import { cn } from '@/lib/utils';
import { updateBookingStatus } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

function BookingCard({
  booking,
  serviceMap,
}: {
  booking: Booking;
  serviceMap: Map<string, string>;
}) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState<Booking['status'] | null>(
    null
  );

  const handleUpdateStatus = async (status: Booking['status']) => {
    setIsUpdating(status);
    const result = await updateBookingStatus(booking.id, status);
    setIsUpdating(null);

    if (result.success && result.data) {
      toast({
        title: 'Sucesso!',
        description: `Agendamento ${
          status === 'Confirmado' ? 'confirmado' : 'cancelado'
        }.`,
      });
      // A atualização do estado agora é gerida pelo Realtime
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card key={booking.id} className="shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-lg">{booking.name}</p>
            <p className="text-sm text-muted-foreground">{booking.email}</p>
          </div>
          <Badge
            variant={
              booking.status === 'Confirmado'
                ? 'default'
                : booking.status === 'Pendente'
                ? 'secondary'
                : 'destructive'
            }
            className={cn(
              'capitalize',
              booking.status === 'Confirmado' && 'bg-green-500/80',
              booking.status === 'Pendente' && 'bg-amber-500/80',
              booking.status === 'Cancelado' && 'bg-red-500/80'
            )}
          >
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <p className="font-medium">
              {serviceMap.get(booking.service_id) || 'Serviço desconhecido'}
            </p>
            <p className="text-sm text-muted-foreground">
              {booking.duration} minutos
            </p>
          </div>
          <div className="flex items-center gap-2 text-lg font-mono">
            <Clock className="h-5 w-5" />
            <span>{booking.time}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={() => handleUpdateStatus('Confirmado')}
          disabled={isUpdating !== null || booking.status === 'Confirmado'}
        >
          {isUpdating === 'Confirmado' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Confirmar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => handleUpdateStatus('Cancelado')}
          disabled={isUpdating !== null || booking.status === 'Cancelado'}
        >
          {isUpdating === 'Cancelado' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-2 h-4 w-4" />
          )}
          Cancelar
        </Button>
      </CardFooter>
    </Card>
  );
}

export function BookingsClient({ bookings: initialBookings }: { bookings: Booking[] }) {
  const [bookings, setBookings] = React.useState(initialBookings);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date()
  );

  const serviceMap = React.useMemo(
    () => new Map(services.map((s) => [s.id, s.name])),
    []
  );

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Change received!', payload);
          const changedBooking = payload.new as Booking;

          if (payload.eventType === 'INSERT') {
            setBookings((currentBookings) => [changedBooking, ...currentBookings]);
          } 
          else if (payload.eventType === 'UPDATE') {
             setBookings((currentBookings) =>
              currentBookings.map((b) =>
                b.id === changedBooking.id ? { ...b, ...changedBooking } : b
              )
            );
          }
          else if (payload.eventType === 'DELETE') {
            const deletedBooking = payload.old as { id: number };
            setBookings((currentBookings) => currentBookings.filter(b => b.id !== deletedBooking.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredBookings = React.useMemo(() => {
    const sortedBookings = [...bookings].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
            return dateB - dateA;
        }
        return b.time.localeCompare(a.time);
    });

    if (!selectedDate) {
      return sortedBookings;
    }
    return sortedBookings.filter((booking) =>
      isSameDay(new Date(booking.date), selectedDate)
    );
  }, [bookings, selectedDate]);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full max-h-[calc(100vh-10rem)] items-stretch"
    >
      <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
        <div className="flex h-full flex-col p-1 pr-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-lg border"
          />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={70}>
        <Card className="h-full">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <span>
                Agendamentos para{' '}
                {selectedDate
                  ? format(selectedDate, 'PPP', { locale: ptBR })
                  : 'Todas as Datas'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              {filteredBookings.length > 0 ? (
                <div className="p-6 grid gap-4">
                  {filteredBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      serviceMap={serviceMap}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-[calc(100vh-16rem)] flex-col items-center justify-center gap-2 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted" />
                  <h3 className="text-xl font-medium tracking-tight">
                    Nenhum agendamento
                  </h3>
                  <p className="text-muted-foreground">
                    Não há agendamentos para a data selecionada.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
