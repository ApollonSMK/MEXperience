import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BookAppointmentView } from "@/components/book-appointment-view";
import type { Metadata } from 'next';
import { Suspense } from 'react';

// Componente de Loading simples para evitar tela branca enquanto carrega
function BookAppointmentLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
       <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground text-sm">Chargement de la réservation...</p>
       </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Réserver un Soin | M.E Experience',
  description: 'Prenez rendez-vous en ligne pour votre séance de Banc Solaire, Collagen Boost ou Hydromassage. Disponibilité en temps réel.',
};

export default function ReserverPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<BookAppointmentLoading />}>
        <BookAppointmentView />
      </Suspense>
      <Footer />
    </>
  );
}