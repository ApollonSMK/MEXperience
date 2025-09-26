import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Meteors } from '@/components/ui/meteors';
import { AnimatedGridPattern } from '@/components/ui/interactive-grid-pattern';
import { cn } from '@/lib/utils';

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
      <body className="font-body antialiased bg-background font-medium">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className={cn(
            '[mask-image:radial-gradient(circle_at_center,white,transparent)]',
            'skew-y-12'
          )}
        />
        <Meteors number={30} />
        <div className="relative min-h-screen flex flex-col bg-transparent">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
