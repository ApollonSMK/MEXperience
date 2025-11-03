'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Home, Users, Briefcase, ClipboardList, Cake, Settings, Calendar, Clock, Menu, ChevronsLeft, ChevronsRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import AdminContent from '@/components/admin-content';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { User } from '@supabase/supabase-js';

const getInitials = (name?: string | null) => {
  if (!name) return 'U';
  return name
      .split(' ')
      .map((n) => n[0])
      .join('');
};

const navItems = [
  {
    group: 'Geral',
    links: [
      { href: '/admin', label: 'Dashboard', icon: Home },
      { href: '/admin/appointments', label: 'Agendamentos', icon: Calendar },
    ],
  },
  {
    group: 'Gestão',
    links: [
      { href: '/admin/users', label: 'Utilisateurs', icon: Users },
      { href: '/admin/birthdays', label: 'Aniversários', icon: Cake },
      { href: '/admin/services', label: 'Serviços', icon: Briefcase },
      { href: '/admin/plans', label: 'Planos', icon: ClipboardList },
      { href: '/admin/schedules', label: 'Horários', icon: Clock },
    ],
  },
  {
    group: 'Definições',
    links: [
      { href: '/admin/settings', label: 'Definições', icon: Settings },
      { href: '/admin/logs', label: 'Logs', icon: ShieldAlert },
    ],
  },
];


function AdminNavMenu({ onLinkClick, isCollapsed }: { onLinkClick?: () => void; isCollapsed: boolean }) {
  return (
    <TooltipProvider>
      <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium", isCollapsed && "px-2")}>
        {navItems.map((group) => (
          <div key={group.group} className="py-2">
            {!isCollapsed && (
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                {group.group}
              </h2>
            )}
            <div className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon;
                if (isCollapsed) {
                  return (
                    <Tooltip key={link.href} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link
                          href={link.href}
                          onClick={onLinkClick}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                        >
                          <Icon className="h-5 w-5" />
                          <span className="sr-only">{link.label}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{link.label}</TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onLinkClick}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const checkUser = async (currentUser: User) => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUser.id)
        .single();
      
      if (!error && profile) {
        setIsAdmin(profile.is_admin);
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (!currentUser) {
          setIsAdmin(false);
          setIsLoading(false);
        } else {
          setIsLoading(true);
          checkUser(currentUser);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  const sidebarClasses = isSidebarCollapsed ? "md:grid-cols-[60px_1fr]" : "md:grid-cols-[280px_1fr]";

  if (!isMounted) {
    return null;
  }

  return (
    <div className={cn("grid h-screen w-full overflow-hidden transition-all duration-300", sidebarClasses)}>
      <div className="hidden border-r bg-background md:block">
        <div className="flex h-full max-h-screen flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <span className={cn(isSidebarCollapsed && "sr-only")}>Painel Admin</span>
            </Link>
          </div>
          <div className="flex-1 py-2 overflow-y-auto">
            <AdminNavMenu isCollapsed={isSidebarCollapsed} />
          </div>
          <div className="mt-auto p-4 border-t">
              <Button variant="outline" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                  {isSidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                  <span className="sr-only">Toggle Sidebar</span>
              </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col h-full overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 shrink-0">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
                    <SheetHeader className="p-4 border-b">
                         <Link href="/admin" onClick={() => setIsSheetOpen(false)} className="flex items-center gap-2 font-semibold">
                            <span className="">Painel Admin</span>
                         </Link>
                         <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                         <SheetDescription className="sr-only">
                            Navegue pelas diferentes seções do painel de administração.
                         </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 py-2 overflow-y-auto">
                        <AdminNavMenu isCollapsed={false} onLinkClick={() => setIsSheetOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>

          <div className="w-full flex-1">
          </div>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.user_metadata?.photo_url ?? ''} alt={user.user_metadata?.display_name ?? 'User'} />
                    <AvatarFallback>{getInitials(user.user_metadata?.display_name || user.email)}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.user_metadata?.display_name || user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>Perfil</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          <AdminContent isLoading={isLoading} isAdmin={isAdmin}>
            {children}
          </AdminContent>
        </main>
      </div>
    </div>
  );
}
