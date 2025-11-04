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
    // Check if user is logged in to decide where to redirect
    // For now, redirecting to appointments page is a good default for logged-in users.
    // Guests might just see a success message on the same page or be redirected to home.
    toast({
        title: "Redirecionando...",
        description: "O seu agendamento foi confirmado. Estamos a redirecioná-lo.",
    });
    router.push('/profile/appointments');
  }, [router, toast]);
  
  const handleGuestBookingComplete = useCallback(() => {
    toast({
        title: "Agendamento Confirmado!",
        description: "Receberá os detalhes do seu agendamento por e-mail.",
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
                    Voltar
                </Button>
            </div>
            <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
                 <div className="p-6">
                    <h1 className="text-2xl font-semibold leading-none tracking-tight">Novo Agendamento</h1>
                    <p className="text-sm text-muted-foreground mt-1">Siga os passos para planear o seu próximo serviço.</p>
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
