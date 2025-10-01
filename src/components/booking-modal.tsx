
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
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { BookingForm } from './booking-form';

type BookingModalProps = {
  children: React.ReactNode;
  serviceId?: string;
  onOpenChange?: (isOpen: boolean) => void;
};

export function BookingModal({ children, serviceId, onOpenChange }: BookingModalProps) {
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
           <div className="overflow-y-auto max-h-[90vh]">
             <BookingForm serviceId={serviceId} onSuccess={handleSuccess} />
           </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl p-0">
         <div className="overflow-y-auto max-h-[90vh]">
            <BookingForm serviceId={serviceId} onSuccess={handleSuccess} />
         </div>
      </DialogContent>
    </Dialog>
  );
}
