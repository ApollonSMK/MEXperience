'use client';

import * as React from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  Clock,
  MoreVertical,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Booking } from '@/app/admin/bookings/page';
import { cn } from '@/lib/utils';

export function BookingsClient({ bookings }: { bookings: Booking[] }) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date()
  );

  const serviceMap = React.useMemo(
    () => new Map(services.map((s) => [s.id, s.name])),
    []
  );

  const filteredBookings = React.useMemo(() => {
    if (!selectedDate) {
      return bookings;
    }
    return bookings.filter((booking) =>
      isSameDay(new Date(booking.date), selectedDate)
    );
  }, [bookings, selectedDate]);

  const today = new Date();

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
                {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : 'Todas as Datas'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              {filteredBookings.length > 0 ? (
                <div className="p-6 grid gap-4">
                  {filteredBookings.map((booking) => (
                    <Card key={booking.id} className="shadow-md">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                             <p className="font-semibold text-lg">{booking.name}</p>
                            <p className="text-sm text-muted-foreground">{booking.email}</p>
                          </div>
                          <Badge
                            variant={
                              booking.status === 'Confirmado' ? 'default'
                              : booking.status === 'Pendente' ? 'secondary'
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
                                <p className="font-medium">{serviceMap.get(booking.service_id) || 'Serviço desconhecido'}</p>
                                <p className="text-sm text-muted-foreground">{booking.duration} minutos</p>
                            </div>
                            <div className="flex items-center gap-2 text-lg font-mono">
                                <Clock className="h-5 w-5" />
                                <span>{booking.time}</span>
                            </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                          <Check className="mr-2 h-4 w-4" />
                          Confirmar
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                          <X className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </CardFooter>
                    </Card>
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
