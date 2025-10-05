
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Service } from '@/lib/services';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarOff, Clock, CalendarCheck, CalendarX, CalendarDays } from 'lucide-react';
import { getIcon } from '@/lib/icon-map';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';


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
  services: Service[];
};

const getStatusClasses = (status: UserBooking['status']) => {
  switch (status) {
    case 'Confirmado':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
    case 'Pendente':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800';
    case 'Cancelado':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
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

const BookingItem = ({ booking, service }: { booking: UserBooking, service: Service | undefined }) => {
    const ServiceIcon = getIcon(service?.icon);
    const bookingDate = new Date(booking.date);
    
    return (
        <div className="p-4 border rounded-lg bg-background flex items-center gap-4 transition-colors hover:bg-muted/50">
            <div className="flex flex-col items-center justify-center p-3 rounded-md bg-muted text-muted-foreground w-20 h-20">
                <span className="text-sm font-semibold uppercase tracking-wide">{format(bookingDate, 'MMM', { locale: ptBR })}</span>
                <span className="text-3xl font-bold text-primary">{format(bookingDate, 'dd')}</span>
                <span className="text-xs">{format(bookingDate, 'yyyy')}</span>
            </div>
            <div className="flex-grow">
                <p className="font-bold text-lg flex items-center gap-2">
                    <ServiceIcon className="w-5 h-5 text-accent" />
                    {service?.name || 'Serviço'}
                </p>
                <p className="text-sm text-muted-foreground">
                    às {booking.time.substring(0,5)} • {booking.duration} min
                </p>
            </div>
            <Badge className={cn("capitalize text-xs font-medium flex items-center gap-1.5 shrink-0", getStatusClasses(booking.status))}>
                <StatusIcon status={booking.status} />
                {booking.status}
            </Badge>
        </div>
    )
}

const EmptyState = ({title, description}: {title: string, description: string}) => (
    <div className="text-center py-16 bg-muted rounded-lg flex flex-col items-center justify-center">
        <CalendarOff className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground mt-2 max-w-xs">{description}</p>
    </div>
)


export function UserBookings({ bookings: initialBookings, services }: UserBookingsProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  useEffect(() => {
    const supabase = createClient();

    const setupSubscription = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const channel = supabase
        .channel('realtime-user-bookings')
        .on(
            'postgres_changes',
            { 
                event: '*', 
                schema: 'public', 
                table: 'bookings',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {
            
            if (payload.eventType === 'INSERT') {
                toast({
                title: "Novo Agendamento!",
                description: "Um novo agendamento foi adicionado à sua lista.",
                });
                setBookings((prev) => [...prev, payload.new as UserBooking].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.time.localeCompare(a.time)));
            } else if (payload.eventType === 'UPDATE') {
                toast({
                title: "Agendamento Atualizado!",
                description: "O estado de um dos seus agendamentos mudou.",
                });
                setBookings((prev) =>
                prev.map((b) => (b.id === (payload.new as UserBooking).id ? (payload.new as UserBooking) : b))
                );
            } else if (payload.eventType === 'DELETE') {
                toast({
                title: "Agendamento Removido",
                description: "Um agendamento foi removido da sua lista.",
                });
                setBookings((prev) => prev.filter((b) => b.id !== (payload.old as Partial<UserBooking>).id));
            }
            }
        )
        .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
    
    const subscriptionCleanupPromise = setupSubscription();

    return () => {
        subscriptionCleanupPromise.then(cleanup => {
            if (cleanup) cleanup();
        });
    }

  }, [router, toast]);


  const today = new Date().toISOString().split('T')[0];
  
  const upcomingBookings = bookings
    .filter((b) => b.date >= today && b.status !== 'Cancelado')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));

  const pastBookings = bookings
    .filter((b) => b.date < today || b.status === 'Cancelado')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.time.localeCompare(a.time));

  return (
    <CardContent className="pt-6">
        <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">
                    <CalendarDays className="mr-2 h-4 w-4"/>
                    Próximos
                </TabsTrigger>
                <TabsTrigger value="past">
                    <Clock className="mr-2 h-4 w-4"/>
                    Histórico
                </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-6">
                {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingBookings.map((booking) => (
                           <BookingItem key={booking.id} booking={booking} service={serviceMap.get(booking.service_id)} />
                        ))}
                    </div>
                ) : (
                    <EmptyState title="Sem Agendamentos Futuros" description="Parece que não tem nenhuma sessão marcada. Agende um novo serviço para começar." />
                )}
            </TabsContent>
            <TabsContent value="past" className="mt-6">
                 {pastBookings.length > 0 ? (
                    <div className="space-y-4">
                        {pastBookings.map((booking) => (
                           <BookingItem key={booking.id} booking={booking} service={serviceMap.get(booking.service_id)} />
                        ))}
                    </div>
                ) : (
                    <EmptyState title="Sem Histórico de Agendamentos" description="As suas sessões passadas aparecerão aqui após a sua primeira visita." />
                )}
            </TabsContent>
        </Tabs>
    </CardContent>
  );
}
