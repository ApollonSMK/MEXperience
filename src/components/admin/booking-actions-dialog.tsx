'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateBookingStatus } from '@/app/admin/actions';
import type { Booking } from '@/app/admin/bookings/page';
import { services } from '@/lib/services';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';


type BookingActionsDialogProps = {
  booking: Booking;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const getStatusClasses = (status: Booking['status']) => {
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


export function BookingActionsDialog({
  booking,
  isOpen,
  onOpenChange,
}: BookingActionsDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<null | 'confirm' | 'cancel'>(null);
  
  const service = services.find((s) => s.id === booking.service_id);

  const handleAction = async (status: 'Confirmado' | 'Cancelado') => {
    setIsLoading(status === 'Confirmado' ? 'confirm' : 'cancel');
    const { success, error } = await updateBookingStatus(booking.id, status);
    setIsLoading(null);

    if (success) {
      toast({
        title: 'Status Atualizado!',
        description: `O agendamento foi ${status.toLowerCase()}.`,
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Erro ao Atualizar',
        description: error || 'Não foi possível atualizar o status do agendamento.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline text-2xl">
            Gerir Agendamento
          </AlertDialogTitle>
           <AlertDialogDescription className="text-base">
            O que você deseja fazer com este agendamento?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Cliente:</span>
              <span className="font-bold">{booking.name}</span>
            </div>
             <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Email:</span>
              <span className="font-bold">{booking.email}</span>
            </div>
             <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Serviço:</span>
              <span className="font-bold">{service?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Data:</span>
              <span className="font-bold">
                {format(new Date(booking.date), "dd/MM/yyyy", { locale: ptBR })} às {booking.time}
              </span>
            </div>
             <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Status Atual:</span>
              <Badge className={cn('capitalize', getStatusClasses(booking.status))}>{booking.status}</Badge>
            </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={!!isLoading}>Fechar</Button>
          </AlertDialogCancel>
           <Button 
                variant="destructive"
                onClick={() => handleAction('Cancelado')}
                disabled={!!isLoading || booking.status === 'Cancelado'}
            >
                {isLoading === 'cancel' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cancelar
            </Button>
            <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleAction('Confirmado')}
                disabled={!!isLoading || booking.status === 'Confirmado'}
            >
                {isLoading === 'confirm' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar
            </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
