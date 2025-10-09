
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LayoutProvider } from '@/components/layout-provider';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { getServices } from '@/lib/services-db';
import type { Service } from '@/lib/services';

export const metadata: Metadata = {
  title: 'M.E. Wellness Experience',
  description: 'Your sanctuary for wellness and relaxation.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const services: Service[] = await getServices();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-body antialiased bg-background font-medium',
          'font-headline',
          'font-body'
        )}
      >
        <LayoutProvider user={user} services={services}>
          {children}
        </LayoutProvider>
        <Toaster />
      </body>
    </html>
  );
}
