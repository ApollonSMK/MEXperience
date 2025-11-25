import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BookAppointmentView } from "@/components/book-appointment-view";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réserver un Soin | M.E Experience',
  description: 'Prenez rendez-vous en ligne pour votre séance de Banc Solaire, Collagen Boost ou Hydromassage. Disponibilité en temps réel.',
};

export default function ReserverPage() {
  return (
    <>
      <Header />
      <BookAppointmentView />
      <Footer />
    </>
  );
}