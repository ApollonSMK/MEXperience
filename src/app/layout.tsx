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
  title: 'M.E Experience',
  description: "Le meilleur du bien-être en toute intimité.",
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