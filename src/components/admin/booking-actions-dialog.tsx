
'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
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
import { Separator } from '../ui/separator';


type BookingActionsDialogProps = {
  booking: Booking | null;
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
  
  if (!booking) {
    return null;
  }
  
  const service = services.find((s) => s.id === booking.service_id);

  const handleAction = async (status: 'Confirmado' | 'Cancelado') => {
    if (!booking) return;

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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-headline text-2xl">
            Detalhes do Agendamento
          </SheetTitle>
           <SheetDescription>
            Veja os detalhes e gira o status do agendamento.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Cliente:</span>
              <span className="font-bold text-right">{booking.name}</span>
            </div>
            <Separator />
             <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Email:</span>
              <span className="font-bold text-right">{booking.email}</span>
            </div>
            <Separator />
             <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Serviço:</span>
              <span className="font-bold text-right">{service?.name || 'N/A'}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Data:</span>
              <span className="font-bold text-right">
                {format(new Date(booking.date), "dd/MM/yyyy", { locale: ptBR })} às {booking.time}
              </span>
            </div>
            <Separator />
             <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Status Atual:</span>
              <Badge className={cn('capitalize', getStatusClasses(booking.status))}>{booking.status}</Badge>
            </div>
        </div>

        <SheetFooter className="pt-6">
          <SheetClose asChild>
            <Button variant="outline" disabled={!!isLoading}>Fechar</Button>
          </SheetClose>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
           <Button 
                variant="destructive"
                onClick={() => handleAction('Cancelado')}
                disabled={!!isLoading || booking.status === 'Cancelado'}
                className="w-full"
            >
                {isLoading === 'cancel' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cancelar
            </Button>
            <Button
                className="bg-green-600 hover:bg-green-700 text-white w-full"
                onClick={() => handleAction('Confirmado')}
                disabled={!!isLoading || booking.status === 'Confirmado'}
            >
                {isLoading === 'confirm' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
