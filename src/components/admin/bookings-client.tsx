
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Users, Clock, Mail, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/types/booking';
import type { Service } from '@/lib/services';
import type { Profile } from '@/types/profile';
import { cn } from '@/lib/utils';
import { iconMap } from '@/lib/icon-map';
import { NewBookingForm } from './new-booking-form';


interface BookingsClientProps {
  initialDateString: string;
  bookings: Booking[];
  services: Service[];
  profiles: Profile[];
}

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
};

const getStatusClasses = (status: Booking['status']) => {
  switch (status) {
    case 'Confirmado':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Cancelado':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Pendente':
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200';
  }
};

export function BookingsClient({ initialDateString, bookings, services, profiles }: BookingsClientProps) {
  const router = useRouter();
  // Initialize state with a Date object parsed from the string prop.
  const [date, setDate] = useState<Date>(parseISO(initialDateString));
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      router.push(`/admin/bookings?date=${formattedDate}`);
    }
  };

  const handleBookingCreated = () => {
    setIsNewBookingModalOpen(false);
    // Refresh the page data by making a new request to the server
    router.refresh();
  }

  const servicesMap = new Map(services.map(s => [s.id, s]));
  
  // This format will now be consistent as it's always derived from the `date` state
  // which was initialized from a server-provided string. The timeZone option prevents
  // the client's local timezone from shifting the date.
  const formattedDisplayDate = format(date, "d 'de' MMMM, yyyy", { locale: ptBR });

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Veja e gira os agendamentos dos seus clientes.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={'outline'}
                className={cn(
                    'w-full sm:w-[280px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                />
            </PopoverContent>
            </Popover>
            <Dialog open={isNewBookingModalOpen} onOpenChange={setIsNewBookingModalOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Novo Agendamento
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Criar Novo Agendamento</DialogTitle>
                        <DialogDescription>
                            Preencha os detalhes abaixo para criar um novo agendamento para um cliente.
                        </DialogDescription>
                    </DialogHeader>
                    <NewBookingForm 
                        services={services}
                        profiles={profiles}
                        onSuccess={handleBookingCreated}
                    />
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Agendamentos para {formattedDisplayDate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const service = servicesMap.get(booking.service_id);
                const ServiceIcon = service ? iconMap[service.icon as keyof typeof iconMap] || iconMap['default'] : iconMap['default'];
                return (
                  <div key={booking.id} className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
                     <div className="flex items-center gap-4 flex-grow">
                        <Avatar className="h-12 w-12">
                           <AvatarImage src={booking.avatar_url || ''} />
                           <AvatarFallback>{getInitials(booking.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                           <p className="font-bold text-lg">{booking.name || 'Cliente Convidado'}</p>
                           <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>{booking.email || 'N/A'}</span>
                                </div>
                                 <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{booking.time.substring(0, 5)} ({booking.duration} min)</span>
                                </div>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <ServiceIcon className="w-5 h-5 text-accent" />
                            <span>{service?.name || 'Serviço Desconhecido'}</span>
                        </div>
                        <Badge className={cn('capitalize', getStatusClasses(booking.status))}>
                            {booking.status}
                        </Badge>
                     </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted rounded-lg flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Nenhum agendamento</h3>
              <p className="text-muted-foreground mt-2">Não há agendamentos para esta data.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
