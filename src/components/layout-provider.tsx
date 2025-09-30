
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function LayoutProvider({
  children,
  user: initialUser,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthConfirmRoute = pathname === '/auth/confirm';
  const hideLayout = isAdminRoute || isAuthConfirmRoute;

  return (
    <div className="relative min-h-screen flex flex-col">
      {!hideLayout && <Header user={user} />}
      <main className="flex-grow">{children}</main>
      {!hideLayout && <Footer />}
    </div>
  );
}
