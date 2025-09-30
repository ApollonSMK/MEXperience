
'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Loader2,
  LayoutDashboard,
  CalendarCheck,
  ArrowLeft,
  Menu,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

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

function AdminNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn('flex flex-col gap-2', className)}>
      <Button asChild variant="outline" className="mb-4">
        <Link href="/profile">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Perfil
        </Link>
      </Button>
      {adminMenuItems.map((item) => (
        <Link href={item.href} key={item.title}>
          <Button
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className="w-full justify-start"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Button>
        </Link>
      ))}
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      if (
        event === 'SIGNED_OUT' ||
        !currentUser ||
        currentUser.email !== ADMIN_EMAIL
      ) {
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
    return null; // A redirection é feita no useEffect
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-muted/40 md:flex flex-col">
         <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Logo />
        </div>
        <div className="flex-1 overflow-auto py-2">
            <AdminNav />
        </div>
        <div className="mt-auto p-4 border-t">
           <div className="text-center text-sm text-muted-foreground p-2">
            <p className="font-semibold">
              {user.user_metadata?.full_name || 'Admin'}
            </p>
            <p className="text-xs">{user.email}</p>
          </div>
          <form action={logout}>
            <Button variant="outline" className="w-full">
              Logout
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
               <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Logo />
              </div>
              <div className="flex-1 overflow-auto py-2">
                <AdminNav className="px-4"/>
              </div>
              <div className="mt-auto p-4 border-t">
                <form action={logout}>
                    <Button variant="outline" className="w-full">
                    Logout
                    </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
           <div className="w-full flex-1">
            <h1 className="text-lg font-semibold">Painel de Administração</h1>
          </div>
          <div className="text-right">
             <p className="text-sm font-semibold">
              {user.user_metadata?.full_name || 'Admin'}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20">
            {children}
        </main>
      </div>
    </div>
  );
}
