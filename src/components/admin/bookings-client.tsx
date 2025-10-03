
'use client';

import * as React from 'react';
import type { Booking } from '@/app/admin/bookings/page';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Profile } from '@/types/profile';
import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, PlusCircle, Check, X, MoreHorizontal, User, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { NewBookingDialog } from './new-booking-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateBookingStatus, deleteBooking } from '@/app/admin/actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useServices } from '@/contexts/services-context';
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


const getInitials = (name: string | null) => {
  if (!name) return '??';
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.length > 2 ? initials.substring(0, 2) : initials;
};

const getStatusClasses = (status: Booking['status']) => {
  switch (status) {
    case 'Confirmado':
      return {
        dot: 'bg-green-500',
        text: 'text-green-700',
        bg: 'bg-green-50',
      };
    case 'Pendente':
      return {
        dot: 'bg-amber-500',
        text: 'text-amber-700',
        bg: 'bg-amber-50',
      };
    case 'Cancelado':
      return {
        dot: 'bg-red-500',
        text: 'text-red-700',
        bg: 'bg-red-50',
      };
    default:
      return {
        dot: 'bg-gray-400',
        text: 'text-gray-600',
        bg: 'bg-gray-50',
      };
  }
};


export function BookingsClient({
  initialBookings,
  initialProfiles,
  selectedDate,
}: {
  initialBookings: Booking[];
  initialProfiles: Profile[];
  selectedDate?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isNewBookingOpen, setIsNewBookingOpen] = React.useState(false);
  const [bookings, setBookings] = React.useState(initialBookings);
  const services = useServices();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [bookingToDelete, setBookingToDelete] = React.useState<number | null>(null)
  
  const date = selectedDate ? new Date(`${selectedDate}T00:00:00`) : startOfDay(new Date());

  React.useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);


  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set('date', format(newDate, 'yyyy-MM-dd'));
      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`/admin/bookings${query}`);
    }
  };
  
  const handleStatusUpdate = async (bookingId: number, status: 'Confirmado' | 'Cancelado') => {
     const { success, error } = await updateBookingStatus(bookingId, status);
     if (success) {
      toast({
        title: 'Status Atualizado!',
        description: `O agendamento foi ${status.toLowerCase()}.`,
      });
      router.refresh(); 
    } else {
      toast({
        title: 'Erro ao Atualizar',
        description: error || 'Não foi possível atualizar o status do agendamento.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteRequest = (bookingId: number) => {
    setBookingToDelete(bookingId);
    setIsDeleteDialogOpen(true);
  }

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
  }


  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
            <p className="text-muted-foreground">
                Gira os agendamentos dos seus clientes para a data selecionada.
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={'outline'}
                className={cn(
                    'w-[280px] justify-start text-left font-normal',
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
                onSelect={handleDateChange}
                initialFocus
                locale={ptBR}
                />
            </PopoverContent>
            </Popover>
            <Button onClick={() => setIsNewBookingOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Agendamento
            </Button>
        </div>
      </div>
      
       <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length > 0 ? bookings.map((booking) => {
              const service = services.find(s => s.id === booking.service_id);
              const statusClasses = getStatusClasses(booking.status);
              return (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.time.substring(0,5)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={booking.profiles?.avatar_url || ''} />
                      <AvatarFallback>{getInitials(booking.profiles?.full_name || booking.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{booking.profiles?.full_name || booking.name}</div>
                      <div className="text-xs text-muted-foreground">{booking.profiles?.email || booking.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{service?.name || 'N/A'}</TableCell>
                <TableCell>{booking.duration} min</TableCell>
                <TableCell className="text-center">
                    <span className={cn('text-xs font-semibold px-2 py-1 rounded-full flex items-center justify-center gap-1.5', statusClasses.bg, statusClasses.text)}>
                        <span className={cn('h-2 w-2 rounded-full', statusClasses.dot)}></span>
                        {booking.status}
                    </span>
                </TableCell>
                <TableCell>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Ver Cliente</span>
                      </DropdownMenuItem>
                      {booking.status !== 'Confirmado' && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'Confirmado')}>
                          <Check className="mr-2 h-4 w-4" />
                          <span>Confirmar</span>
                        </DropdownMenuItem>
                      )}
                       {booking.status !== 'Cancelado' && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'Cancelado')}>
                          <X className="mr-2 h-4 w-4" />
                          <span>Cancelar</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-red-500 focus:text-red-500"
                        onClick={() => handleDeleteRequest(booking.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Eliminar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )}) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum agendamento para esta data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
       </div>

      <NewBookingDialog
        isOpen={isNewBookingOpen}
        onOpenChange={setIsNewBookingOpen}
        bookingDate={date}
        profiles={initialProfiles}
        onSuccess={() => {
            setIsNewBookingOpen(false);
            router.refresh();
        }}
      />
      
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
                Sim, eliminar agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
