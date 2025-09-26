import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { LightRays } from '@/components/ui/light-rays';
import { Meteors } from '@/components/ui/meteors';

export const metadata: Metadata = {
  title: 'M.E. Wellness Experience',
  description: 'Your sanctuary for wellness and relaxation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background">
        <LightRays
          speed={4}
          color="rgba(255, 100, 100, 0.6)"
          opacity={0.8}
          blur={12}
        />
        <Meteors number={30} />
        <div className="relative z-10 min-h-screen flex flex-col bg-transparent">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
