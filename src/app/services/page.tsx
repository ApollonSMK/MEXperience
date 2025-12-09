import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ServicesView } from "@/components/services-view";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos Services de Bien-être | M.E Experience',
  description: 'Découvrez notre gamme de soins : Banc Solaire, Collagen Boost, Dôme Infrarouge et Hydromassage. Technologie de pointe pour votre corps.',
};

export default function ServicesPage() {
  return (
    <>
      <Header />
      <ServicesView />
      <Footer />
    </>
  );
}