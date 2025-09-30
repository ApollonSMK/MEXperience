
'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import type { User } from '@supabase/supabase-js';

export function LayoutProvider({ children, user }: { children: React.ReactNode, user: User | null }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className="relative min-h-screen flex flex-col">
      {!isAdminRoute && <Header user={user} />}
      <main className="flex-grow">{children}</main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}
