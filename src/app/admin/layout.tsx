
'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, LayoutDashboard, CalendarCheck } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';

const ADMIN_EMAIL = 'contact@me-experience.lu';

const adminMenuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    title: 'Agendamentos',
    icon: CalendarCheck,
    href: '/admin/bookings',
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setUser(currentUser);
      } else {
        setUser(null);
        redirect('/login');
      }
      setLoading(false);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      if (event === 'SIGNED_OUT' || !currentUser || currentUser.email !== ADMIN_EMAIL) {
         setUser(null);
         redirect('/login');
      } else {
        setUser(currentUser);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    // This is a fallback, the effect should handle redirection.
    return (
       <div className="flex items-center justify-center min-h-screen bg-background">
        <p>A redirecionar para o login...</p>
      </div>
    );
  }

  return (
      <div className="min-h-screen w-full flex">
        <aside className="w-64 border-r bg-background p-4 flex flex-col">
            <div className="p-4 mb-4">
                <Logo />
            </div>
            <nav className="flex flex-col gap-2">
                 {adminMenuItems.map((item) => (
                    <Link href={item.href} key={item.title}>
                        <Button 
                            variant={pathname === item.href ? "secondary" : "ghost"} 
                            className="w-full justify-start"
                        >
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.title}
                        </Button>
                    </Link>
                 ))}
            </nav>
            <div className="mt-auto">
                <div className="text-center text-sm text-muted-foreground p-2">
                    <p className="font-semibold">{user.user_metadata?.full_name || 'Admin'}</p>
                    <p className="text-xs">{user.email}</p>
                </div>
                <form action={logout}>
                  <Button variant="outline" className="w-full">
                    Logout
                  </Button>
                </form>
            </div>
        </aside>
        <main className="flex-1 bg-muted/40">
          {children}
        </main>
      </div>
  );
}
