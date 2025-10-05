
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format, parseISO, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Users, PlusCircle, MoreHorizontal, CheckCircle, AlertCircle, XCircle, Loader2, Clock, Trash2 } from 'lucide-react';
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
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/types/booking';
import type { Service } from '@/lib/services';
import type { Profile } from '@/types/profile';
import { cn } from '@/lib/utils';
import { iconMap } from '@/lib/icon-map';
import { NewBookingForm } from './new-booking-form';
import { updateBookingStatus, deleteBooking } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';


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
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
    case 'Cancelado':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
    case 'Pendente':
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700';
  }
};

export function BookingsClient({ initialDateString, bookings: initialBookings, services, profiles }: BookingsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date>(parseISO(initialDateString));
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )
  
  // This effect ensures that if the server passes new bookings (e.g. after a refresh),
  // the local state is updated.
  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);
  
  // This effect sets up the real-time subscription.
  useEffect(() => {
    const channel = createClient()
      .channel('realtime-bookings-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
           console.log('Realtime update received:', payload);
           toast({
             title: "Agenda Atualizada!",
             description: "A lista de agendamentos foi atualizada em tempo real.",
           });
          // Instead of trying to manage state manually, we just tell Next.js to
          // refresh the data from the server. The useEffect above will then
          // update the local state with the fresh data.
          router.refresh(); 
        }
      )
      .subscribe();

    // Cleanup function to remove the channel subscription when the component unmounts.
    return () => {
      createClient().removeChannel(channel);
    };
  }, [router, toast]);


  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      // This will trigger a server-side render and the new bookings will be passed
      // as `initialBookings`, which the useEffect above will catch.
      router.push(`${pathname}?${createQueryString('date', formattedDate)}`);
    }
  };

  const handleBookingCreated = () => {
    setIsNewBookingModalOpen(false);
    // No need to manually update state, router.refresh() in the action handles it.
  }

  const handleStatusChange = async (bookingId: number, newStatus: Booking['status']) => {
    setUpdatingId(bookingId);

    const originalBookings = [...bookings];
    // Optimistic UI update
    setBookings(currentBookings =>
      currentBookings.map(b => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );

    const result = await updateBookingStatus(bookingId, newStatus);
    setUpdatingId(null);

    if (result.success) {
      toast({
        title: "Estado Atualizado!",
        description: `O agendamento foi marcado como "${newStatus}".`,
      });
      // The server action will revalidate the path, so router.refresh() is not strictly needed here,
      // but it doesn't hurt to be explicit for consistency.
      router.refresh();
    } else {
      // Revert UI on failure
      setBookings(originalBookings);
      toast({
        title: "Erro ao Atualizar",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRequest = (bookingId: number) => {
    setBookingToDelete(bookingId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookingToDelete) return;

    const result = await deleteBooking(bookingToDelete);

    if (result.success) {
        toast({ title: "Agendamento Eliminado", description: "O agendamento foi eliminado com sucesso."});
        // Server action revalidates, which triggers a refresh and updates props.
    } else {
        toast({ title: "Erro ao Eliminar", description: result.error, variant: "destructive" });
    }
    
    setIsDeleteDialogOpen(false);
    setBookingToDelete(null);
  };


  const servicesMap = new Map(services.map(s => [s.id, s]));
  const formattedDisplayDate = format(date, "d 'de' MMMM, yyyy", { locale: ptBR });

  const groupedBookings = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      if (!booking.time) return acc;
      const hour = booking.time.substring(0, 2) + ':00';
      if (!acc[hour]) {
        acc[hour] = [];
      }
      acc[hour].push(booking);
      return acc;
    }, {} as Record<string, Booking[]>);
  }, [bookings]);

  const sortedTimeSlots = Object.keys(groupedBookings).sort();

  return (
    <>
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
              Agenda para {formattedDisplayDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length > 0 ? (
              <div className="space-y-8">
                {sortedTimeSlots.map((timeSlot) => (
                  <div key={timeSlot} className="relative pl-8">
                    {/* Timeline element */}
                    <div className="absolute left-0 top-0 flex items-center">
                      <div className="h-4 w-4 rounded-full bg-accent ring-4 ring-background z-10"></div>
                      <div className="h-0.5 w-4 bg-border"></div>
                    </div>
                    <div className="absolute left-[7px] top-4 h-full border-l-2 border-dashed border-border"></div>
                    
                    {/* Time slot header */}
                    <div className="mb-4">
                      <p className="font-bold text-lg text-primary">{timeSlot}</p>
                    </div>

                    {/* Bookings for this time slot */}
                    <div className="space-y-4">
                      {groupedBookings[timeSlot].map(booking => {
                        const service = servicesMap.get(booking.service_id);
                        const ServiceIcon = service ? iconMap[service.icon as keyof typeof iconMap] || iconMap['default'] : iconMap['default'];
                        const isUpdating = updatingId === booking.id;
                        const bookingDate = new Date(booking.date);

                        return (
                          <div key={booking.id} className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card ml-8">
                              <div className="flex items-center gap-4 flex-grow">
                                <div className="flex flex-col items-center justify-center p-3 rounded-md bg-muted text-muted-foreground w-24 h-20 flex-shrink-0">
                                    <span className="text-sm font-semibold uppercase tracking-wide">{format(bookingDate, 'MMM', { locale: ptBR })}</span>
                                    <span className="text-3xl font-bold text-primary">{format(bookingDate, 'dd')}</span>
                                    <span className="text-xs">{format(bookingDate, 'yyyy')}</span>
                                </div>
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={booking.avatar_url || ''} />
                                    <AvatarFallback>{getInitials(booking.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <p className="font-bold text-lg flex items-center gap-2">
                                      <ServiceIcon className="w-5 h-5 text-accent" />
                                      {service?.name || 'Serviço Desconhecido'}
                                    </p>
                                    <div className="flex flex-col text-sm text-muted-foreground">
                                        <span>{booking.name || 'Cliente Convidado'}</span>
                                        <span className="text-xs">{booking.time ? booking.time.substring(0, 5) : 'N/A'} • {booking.duration} min</span>
                                    </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                <Badge className={cn('capitalize w-32 justify-center', getStatusClasses(booking.status))}>
                                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : booking.status}
                                </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Alterar Estado</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'Confirmado')} disabled={booking.status === 'Confirmado'}>
                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                            Confirmado
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'Pendente')} disabled={booking.status === 'Pendente'}>
                                            <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                                            Pendente
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'Cancelado')} disabled={booking.status === 'Cancelado'} className="text-red-600 focus:text-red-600">
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Cancelado
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                            onClick={() => handleDeleteRequest(booking.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                              </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto irá eliminar permanentemente
              o agendamento da base de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Sim, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    