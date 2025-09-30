'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect, usePathname } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import {
  LayoutDashboard,
  CalendarCheck,
  User,
  LogOut,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'admin@mewellness.pt';

const menuItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/bookings',
    label: 'Agendamentos',
    icon: CalendarCheck,
  },
];

function AdminSidebar({ user }: { user: SupabaseUser }) {
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo />
          <h2 className="font-headline text-2xl font-bold group-data-[collapsible=icon]:hidden">
            Admin
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user.user_metadata?.full_name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <p className="font-semibold truncate">
              {user.user_metadata?.full_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        <form action={logout}>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <LogOut />
            <span className="group-data-[collapsible=icon]:hidden">
              Logout
            </span>
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
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
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        redirect('/login');
      }
      setUser(currentUser);
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    // This should not happen if the logic above is correct, but as a fallback
    return redirect('/login');
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b md:justify-end">
          <SidebarTrigger className="md:hidden" />
          <p className="text-sm font-medium md:hidden">
            Painel de Administração
          </p>
          <div />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/40">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
