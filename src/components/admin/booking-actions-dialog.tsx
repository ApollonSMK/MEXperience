
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
import { Loader2, User, History, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link';

type BookingActionsDialogProps = {
  booking: Booking | null;
  allBookings: Booking[];
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

const getInitials = (name: string | null) => {
  if (!name) return '??';
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.length > 2 ? initials.substring(0, 2) : initials;
};

export function BookingActionsDialog({
  booking,
  allBookings,
  isOpen,
  onOpenChange,
}: BookingActionsDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<null | 'confirm' | 'cancel'>(null);
  
  if (!booking) {
    return null;
  }
  
  const service = services.find((s) => s.id === booking.service_id);
  const userProfile = booking.profiles;
  const userBookings = allBookings.filter(b => b.user_id === booking.user_id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
            Veja os detalhes do cliente e do agendamento.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="client" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="client"><User className="mr-2 h-4 w-4" />Cliente</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-2 h-4 w-4" />Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="client" className="py-6 space-y-4 text-sm">
             <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={userProfile?.avatar_url || ''} alt={userProfile?.full_name || ''} />
                    <AvatarFallback>{getInitials(userProfile?.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-base">{userProfile?.full_name}</p>
                    <p className="text-muted-foreground">{userProfile?.email}</p>
                    <p className="text-muted-foreground">{userProfile?.phone}</p>
                </div>
            </div>
            <Separator />
            <div className="space-y-4">
                 <div className="flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Serviço:</span>
                  <span className="font-bold text-right">{service?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Data:</span>
                  <span className="font-bold text-right">
                    {format(new Date(booking.date), "dd/MM/yyyy", { locale: ptBR })} às {booking.time.substring(0,5)}
                  </span>
                </div>
                 <div className="flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Status Atual:</span>
                  <Badge className={cn('capitalize', getStatusClasses(booking.status))}>{booking.status}</Badge>
                </div>
            </div>
            {userProfile && (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/admin/users/${userProfile.id}`}>
                  Ver Perfil Completo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </TabsContent>
          <TabsContent value="history" className="py-6 space-y-2 max-h-[50vh] overflow-y-auto">
             {userBookings.map(b => {
               const histService = services.find(s => s.id === b.service_id);
               return (
                <div key={b.id} className={cn("p-3 border rounded-lg text-xs", b.id === booking.id && "bg-muted border-accent")}>
                  <p className="font-bold">{histService?.name}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">
                      {format(new Date(b.date), "dd/MM/yy", { locale: ptBR })} às {b.time.substring(0,5)}
                    </p>
                    <Badge className={cn("capitalize text-xs", getStatusClasses(b.status))}>{b.status}</Badge>
                  </div>
                </div>
               )
             })}
          </TabsContent>
        </Tabs>

        <SheetFooter>
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

    