import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { InteractiveGridPattern } from '@/components/ui/interactive-grid-pattern';
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
      <body className="font-body antialiased bg-[#222]">
        <div className="fixed inset-0 -z-20 h-screen w-full">
          <InteractiveGridPattern
            className={cn(
              '[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]',
              'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12'
            )}
            squaresClassName="hover:fill-blue-500"
          />
        </div>
        <div className="min-h-screen flex flex-col bg-transparent">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
