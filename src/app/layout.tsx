import type {Metadata} from 'next';
import { Carme } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const carme = Carme({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-carme',
});

export const metadata: Metadata = {
  title: {
    template: '%s | M.E Experience',
    default: 'M.E Experience - Solarium, Collagen Boost & Bien-être',
  },
  description: "Découvrez M.E Experience à Luxembourg. Votre sanctuaire de bien-être avec Solarium, Collagen Boost, Hydromassage et Dôme Infrarouge. Réservez votre séance privée dès aujourd'hui.",
  keywords: ["Solarium", "Collagen Boost", "Hydromassage", "Dôme Infrarouge", "Bien-être", "Luxembourg", "Spa Privé", "Relaxation", "Beauté"],
  authors: [{ name: "M.E Experience" }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://me-experience.lu',
    title: 'M.E Experience - Solarium, Collagen Boost & Bien-être',
    description: 'Le meilleur du bien-être en toute intimité à Luxembourg.',
    siteName: 'M.E Experience',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${carme.variable} font-body antialiased`}>
          {children}
        <Toaster />
      </body>
    </html>
  );
}