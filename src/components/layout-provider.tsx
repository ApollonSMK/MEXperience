
'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import type { User } from '@supabase/supabase-js';

export function LayoutProvider({ children, user }: { children: React.ReactNode, user: User | null }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const hideLayout = ['/login', '/signup', '/auth/confirm'].includes(pathname) || isAdminRoute;


  return (
    <div className="relative min-h-screen flex flex-col">
      {!hideLayout && <Header user={user} />}
      <main className="flex-grow">{children}</main>
      {!hideLayout && <Footer />}
    </div>
  );
}
