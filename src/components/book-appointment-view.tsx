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
    <main className="flex min-h-screen flex-col bg-background">
        <div className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
            <AppointmentScheduler 
                onBookingComplete={handleBookingComplete}
            />
        </div>
    </main>
  );
}

export function BookAppointmentView() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
      <BookAppointmentContent />
    </Suspense>
  );
}