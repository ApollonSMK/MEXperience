'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AppointmentScheduler } from '@/components/appointment-scheduler';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BookAppointmentPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleBookingComplete = useCallback(() => {
    toast({
        title: "Redirection en cours...",
        description: "Votre rendez-vous a été confirmé. Nous vous redirigeons.",
    });
    router.push('/profile/appointments');
  }, [router, toast]);
  
  const handleGuestBookingComplete = useCallback(() => {
    toast({
        title: "Rendez-vous Confirmé !",
        description: "Vous recevrez les détails de votre rendez-vous par e-mail.",
        duration: 5000,
    });
    router.push('/');
  }, [router, toast]);

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
            </div>
            <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
                 <div className="p-6">
                    <h1 className="text-2xl font-semibold leading-none tracking-tight">Nouveau Rendez-vous</h1>
                    <p className="text-sm text-muted-foreground mt-1">Suivez les étapes pour planifier votre prochain service.</p>
                </div>
                <AppointmentScheduler 
                    onBookingComplete={handleBookingComplete}
                    onGuestBookingComplete={handleGuestBookingComplete}
                />
            </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
