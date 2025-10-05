
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format, parseISO, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Users, PlusCircle, MoreHorizontal, CheckCircle, AlertCircle, XCircle, Loader2, Clock, Trash2, Edit } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogContent,
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/types/booking';
import type { Service } from '@/lib/services';
import type { Profile } from '@/types/profile';
import { cn } from '@/lib/utils';
import { iconMap } from '@/lib/icon-map';
import { NewBookingForm } from './new-booking-form';
import { updateBookingStatus, deleteBooking, updateBookingDateTime } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '../ui/label';

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

const timeSlots = Array.from({ length: (21 - 7) * 4 }, (_, i) => {
    const totalMinutes = 7 * 60 + i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

function EditBookingSheet({ booking, isOpen, onOpenChange, onSuccess }: { booking: Booking | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(booking ? parseISO(booking.date) : new Date());
    const [selectedTime, setSelectedTime] = useState<string | undefined>(booking ? booking.time.substring(0, 5) : undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (booking) {
            setSelectedDate(parseISO(booking.date));
            setSelectedTime(booking.time.substring(0, 5));
        }
    }, [booking]);

    const handleSubmit = async () => {
        if (!booking || !selectedDate || !selectedTime) {
            toast({ title: "Erro", description: "Por favor, selecione uma data e hora.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const result = await updateBookingDateTime(booking.id, format(selectedDate, 'yyyy-MM-dd'), `${selectedTime}:00`);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: "Agendamento Movido", description: "A data/hora do agendamento foi atualizada com sucesso." });
            onSuccess();
        } else {
            toast({ title: "Erro ao Mover", description: result.error, variant: "destructive" });
        }
    }

    if (!booking) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Editar Agendamento</SheetTitle>
                    <SheetDescription>
                        Altere a data e a hora do agendamento para <span className="font-bold">{booking.name || "Convidado"}</span>.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                    <div className="flex flex-col items-center">
                        <Label>Data</Label>
                         <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="time-select">Hora</Label>
                        <Select onValueChange={setSelectedTime} defaultValue={selectedTime}>
                            <SelectTrigger id="time-select">
                                <SelectValue placeholder="Selecione a hora" />
                            </SelectTrigger>
                            <SelectContent>
                                {timeSlots.map(time => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? "A Guardar..." : "Guardar Alterações"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

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

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )
  
  useEffect(() => {
    setBookings(initialBookings);
  }, [initialDateString, initialBookings]);
  
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-bookings-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
           toast({
            title: "Agenda Atualizada!",
            description: "A lista de agendamentos foi atualizada em tempo real.",
          });
          
          // Re-fetch data on any change
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, router]);


  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      router.push(`${pathname}?${createQueryString('date', formattedDate)}`);
    }
  };

  const handleBookingCreated = () => {
    setIsNewBookingModalOpen(false);
    router.refresh();
  }

  const handleStatusChange = async (bookingId: number, newStatus: Booking['status']) => {
    setUpdatingId(bookingId);

    const result = await updateBookingStatus(bookingId, newStatus);
    setUpdatingId(null);

    if (result.success) {
      toast({
        title: "Estado Atualizado!",
        description: `O agendamento foi marcado como "${newStatus}".`,
      });
       router.refresh();
    } else {
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
         router.refresh();
    } else {
        toast({ title: "Erro ao Eliminar", description: result.error, variant: "destructive" });
    }
    setIsDeleteDialogOpen(false);
    setBookingToDelete(null);
  };

  const handleEditRequest = (booking: Booking) => {
    setBookingToEdit(booking);
    setIsEditSheetOpen(true);
  }

  const handleEditSuccess = () => {
      setIsEditSheetOpen(false);
      setBookingToEdit(null);
      router.refresh();
  }


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
                            Preencha os detalhes abaixo para criar um novo agendamento para um
                            cliente.
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
                        
                        let bookingDate;
                        try {
                            bookingDate = parseISO(booking.date);
                            if (isNaN(bookingDate.getTime())) {
                                bookingDate = new Date();
                            }
                        } catch(e) {
                             bookingDate = new Date();
                        }


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
                                        <DropdownMenuLabel>Ações do Agendamento</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleEditRequest(booking)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar Data/Hora
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Alterar Estado</DropdownMenuLabel>
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
      <EditBookingSheet 
        booking={bookingToEdit}
        isOpen={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}

    