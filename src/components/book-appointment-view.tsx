'use client';

import { useRouter } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import { AppointmentScheduler } from '@/components/appointment-scheduler';
import { useToast } from '@/hooks/use-toast';

function BookAppointmentContent() {
  const router = useRouter();
  const { toast } = useToast();

  const handleBookingComplete = useCallback(() => {
    toast({
        title: "Redirection en cours...",
        description: "Votre rendez-vous a été confirmé. Nous vous redirigeons vers votre profil.",
    });
    router.push('/profile/appointments');
  }, [router, toast]);
  
  return (
    <div className="container mx-auto px-4 py-8 min-h-[60vh]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Réserver un rendez-vous</h1>
          <p className="mt-2 text-muted-foreground">Choisissez un moment convenable pour votre rendez-vous</p>
        </div>
        <AppointmentScheduler 
          onBookingComplete={handleBookingComplete}
        />
      </div>
    </div>
  );
}

export function BookAppointmentView() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
      <BookAppointmentContent />
    </Suspense>
  );
}