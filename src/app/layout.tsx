import type { Metadata, Viewport } from 'next';
import { Carme } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import FacebookPixel from '@/components/facebook-pixel';
import { Suspense } from 'react';

const carme = Carme({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-carme',
});

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming, feels more like an app
};

export const metadata: Metadata = {
  title: {
    template: '%s | M.E Experience',
    default: 'M.E Experience - Banc Solaire, Collagen Boost & Bien-être',
  },
  description: "Découvrez M.E Experience à Luxembourg. Votre sanctuaire de bien-être avec Banc Solaire, Collagen Boost, Hydromassage et Dôme Infrarouge. Réservez votre séance privée dès aujourd'hui.",
  applicationName: 'M.E Experience',
  appleWebApp: {
    capable: true,
    title: 'M.E Experience',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  keywords: ["Banc Solaire", "Collagen Boost", "Hydromassage", "Dôme Infrarouge", "Bien-être", "Luxembourg", "Spa Privé", "Relaxation", "Beauté"],
  authors: [{ name: "M.E Experience" }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://me-experience.lu',
    title: 'M.E Experience - Banc Solaire, Collagen Boost & Bien-être',
    description: 'Le meilleur du bien-être en toute intimité à Luxembourg.',
    siteName: 'M.E Experience',
  },
  manifest: '/manifest.json', // Next.js auto-generates this from manifest.ts
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${carme.variable} font-body antialiased overscroll-none`}>
          <Suspense fallback={null}>
            <FacebookPixel />
          </Suspense>
          {children}
        <Toaster />
      </body>
    </html>
  );
}