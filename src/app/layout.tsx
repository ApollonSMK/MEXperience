
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LayoutProvider } from '@/components/layout-provider';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { cn } from '@/lib/utils';

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

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-body antialiased bg-background font-medium',
          'font-headline',
          'font-body'
        )}
      >
        <LayoutProvider user={user}>
          {children}
        </LayoutProvider>
        <Toaster />
      </body>
    </html>
  );
}
