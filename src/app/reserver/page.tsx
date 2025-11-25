'use client';

import { useRouter } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AppointmentScheduler } from '@/components/appointment-scheduler';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-background">
        <div className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
            <AppointmentScheduler 
                onBookingComplete={handleBookingComplete}
            />
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
      <BookAppointmentContent />
    </Suspense>
  );
}
