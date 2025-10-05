
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { BookingForm } from './booking-form';
import type { Service } from '@/lib/services';

type BookingModalProps = {
  children: React.ReactNode;
  serviceId?: string;
  services: Service[];
  onOpenChange?: (isOpen: boolean) => void;
};

export function BookingModal({ children, serviceId, services, onOpenChange }: BookingModalProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  };

  const handleSuccess = () => {
    setOpen(false);
    if (onOpenChange) {
        onOpenChange(false);
    }
    // Optionally trigger a data refresh here if needed
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
           <DrawerHeader className="text-left">
              <DrawerTitle>Agendar uma sessão</DrawerTitle>
              <DrawerDescription>
                Siga os passos para selecionar e confirmar o seu agendamento.
              </DrawerDescription>
           </DrawerHeader>
           <div className="overflow-y-auto px-4 pb-4">
             <BookingForm serviceId={serviceId} services={services} onSuccess={handleSuccess} />
           </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Agendar uma sessão</DialogTitle>
            <DialogDescription>
                Siga os passos para selecionar e confirmar o seu agendamento.
            </DialogDescription>
          </DialogHeader>
         <div className="overflow-y-auto max-h-[80vh] p-6">
            <BookingForm serviceId={serviceId} services={services} onSuccess={handleSuccess} />
         </div>
      </DialogContent>
    </Dialog>
  );
}
