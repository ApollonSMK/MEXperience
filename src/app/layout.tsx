import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LayoutProvider } from '@/components/layout-provider';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Montserrat, PT_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'M.E. Wellness Experience',
  description: 'Your sanctuary for wellness and relaxation.',
};

const fontHeadline = Montserrat({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-headline',
});

const fontBody = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-body antialiased bg-background font-medium',
          fontHeadline.variable,
          fontBody.variable
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
