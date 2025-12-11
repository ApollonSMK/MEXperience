'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Home, Users, Briefcase, ClipboardList, Cake, Settings, Calendar, Clock, Menu, ChevronsLeft, ChevronsRight, ShieldAlert, LayoutTemplate, CreditCard, Mail, Ticket, Coins, Gift, Store, UserPlus, TrendingUp, Share2 } from 'lucide-react';
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
import { AdminClientCreator } from '@/components/admin-client-creator';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

const getInitials = (name?: string | null) => {
  if (!name) return 'U';
  return name
      .split(' ')
      .map((n) => n[0])
      .join('');
};

const navItems = [
  {
    group: 'Général',
    links: [
      { href: '/admin', label: 'Tableau de Bord', icon: Home },
      { href: '/admin/appointments', label: 'Rendez-vous', icon: Calendar },
    ],
  },
  {
    group: 'Gestion',
    links: [
      { href: '/admin/users', label: 'Utilisateurs', icon: Users },
      { href: '/admin/resellers', label: 'Revendeurs', icon: Store },
      { href: '/admin/referrals', label: 'Parrainage', icon: Share2 },
      { href: '/admin/invitations', label: 'Invitations', icon: Ticket },
      { href: '/admin/gift-cards', label: 'Chèques Cadeaux', icon: Gift },
      { href: '/admin/birthdays', label: 'Anniversaires', icon: Cake },
      { href: '/admin/services', label: 'Services', icon: Briefcase },
      { href: '/admin/plans', label: 'Abonnements', icon: ClipboardList },
      { href: '/admin/minute-packs', label: 'Packs Minutes', icon: Coins },
      { href: '/admin/schedules', label: 'Horaires', icon: Clock },
      { href: '/admin/invoicing', label: 'Facturation', icon: CreditCard },
    ],
  },
  {
    group: 'Mise en Page',
    links: [
      { href: '/admin/layout/hero', label: 'Hero', icon: LayoutTemplate },
    ]
  },
  {
    group: 'Paramètres',
    links: [
      { href: '/admin/settings', label: 'Paramètres', icon: Settings },
      { href: '/admin/settings/email-templates', label: 'Modèles Emails', icon: Mail },
      { href: '/admin/logs', label: 'Logs', icon: ShieldAlert },
    ],
  },
];


function AdminNavMenu({ onLinkClick, isCollapsed, variant = 'light' }: { onLinkClick?: () => void; isCollapsed: boolean, variant?: 'light' | 'dark' }) {
  const isDark = variant === 'dark';
  
  // Classes dinâmicas baseadas no tema (Dark/Light)
  const textColor = isDark ? "text-zinc-200" : "text-muted-foreground";
  const hoverColor = isDark ? "hover:text-white hover:bg-zinc-800" : "hover:text-foreground hover:bg-muted";
  const headingColor = isDark ? "text-zinc-100" : "text-foreground";
  
  return (
    <TooltipProvider>
      <nav className={cn("grid items-start gap-1 px-4 text-sm font-medium", isCollapsed && "px-2")}>
        {navItems.map((group) => (
          <div key={group.group} className="py-2">
            {!isCollapsed && (
              <h2 className={cn("mb-2 px-2 text-lg font-semibold tracking-tight", headingColor)}>
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
                          className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8",
                              textColor,
                              hoverColor
                          )}
                        >
                          <Icon className={cn("h-7 w-7", isDark && "stroke-[2]")} />
                          <span className="sr-only">{link.label}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="right" 
                        className={isDark ? "bg-black text-white border-zinc-800" : ""}
                      >
                        {link.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onLinkClick}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                        textColor,
                        hoverColor
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isDark && "stroke-[2]")} />
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
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Use a ref to track the last verified user ID to avoid re-triggering checks on same session
  const lastVerifiedUserRef = useRef<string | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const checkUser = async (currentUser: User) => {
        if (!supabase) return;
        
        // If we already verified this user, don't block UI
        const isSameUser = lastVerifiedUserRef.current === currentUser.id;
        
        // Only show loading spinner if it's a new user verification
        if (!isSameUser) {
            setIsLoading(true);
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', currentUser.id)
            .single();

        const userIsAdmin = profile?.is_admin === true;
        setIsAdmin(userIsAdmin);
        lastVerifiedUserRef.current = currentUser.id;
        
        if (!userIsAdmin) {
            router.push('/');
        }
        setIsLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (!currentUser) {
          setIsAdmin(false);
          setIsLoading(false);
          lastVerifiedUserRef.current = null;
          router.push('/');
        } else {
          // Check if we need to re-verify (only if user changed)
          if (lastVerifiedUserRef.current !== currentUser.id) {
             checkUser(currentUser);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  const sidebarClasses = isSidebarCollapsed ? "md:grid-cols-[60px_1fr]" : "md:grid-cols-[280px_1fr]";

  if (!isMounted) {
    return null;
  }

  return (
    <div className={cn("grid min-h-[100dvh] w-full overflow-hidden transition-all duration-300", sidebarClasses)}>
      {/* SIDEBAR DESKTOP - Dark Theme */}
      <div className="hidden border-r bg-zinc-950 text-zinc-100 md:block">
        <div className="flex h-full max-h-[100dvh] flex-col">
          <div className="flex h-14 items-center border-b border-zinc-800 px-4">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <span className={cn("text-white", isSidebarCollapsed && "sr-only")}>Panneau Admin</span>
            </Link>
          </div>
          <div className="flex-1 py-2 overflow-y-auto custom-scrollbar-dark">
            <AdminNavMenu isCollapsed={isSidebarCollapsed} variant="dark" />
          </div>
          <div className="mt-auto p-4 border-t border-zinc-800">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                  {isSidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                  <span className="sr-only">Toggle Sidebar</span>
              </Button>
          </div>
        </div>
      </div>
      
      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col h-[100dvh] overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 shrink-0">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                    >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Ouvrir le menu de navigation</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                    <SheetHeader className="border-b p-4">
                        <SheetTitle className="sr-only">Menu</SheetTitle>
                        <SheetDescription className="sr-only">Navigation principale du site</SheetDescription>
                        <Link href="/admin" onClick={() => setIsSheetOpen(false)} className="flex items-center gap-2 font-semibold">
                            <span className="">M.E Experience</span>
                        </Link>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto">
                         {/* Mobile Menu keeps light variant (default) */}
                         <AdminNavMenu isCollapsed={false} onLinkClick={() => setIsSheetOpen(false)} variant="light" />
                    </div>
                </SheetContent>
            </Sheet>

          <div className="w-full flex-1">
          </div>
          
          {/* NEW CLIENT BUTTON */}
          <Sheet open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
              <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-dashed">
                      <UserPlus className="h-4 w-4" />
                      <span className="font-semibold">Nouveau Client</span>
                  </Button>
              </SheetTrigger>
              <SheetTrigger asChild>
                   <Button variant="ghost" size="icon" className="md:hidden">
                      <UserPlus className="h-5 w-5" />
                   </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 sm:max-w-[540px] w-full">
                  <SheetHeader className="sr-only">
                      <SheetTitle>Nouveau Client</SheetTitle>
                      <SheetDescription>Créer un nouveau profil client.</SheetDescription>
                  </SheetHeader>
                  <AdminClientCreator 
                      onSuccess={(newClient) => {
                          setIsNewClientOpen(false);
                          router.push(`/admin/users/${newClient.id}`);
                      }} 
                      onCancel={() => setIsNewClientOpen(false)} 
                  />
              </SheetContent>
          </Sheet>

          {/* POS BUTTON */}
          <Link href="/admin/pos">
            <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5">
                <Store className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">POS / Loja</span>
            </Button>
          </Link>
          <Link href="/admin/pos" className="md:hidden">
             <Button variant="ghost" size="icon">
                <Store className="h-5 w-5" />
             </Button>
          </Link>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.user_metadata?.photo_url ?? ''} alt={user.user_metadata?.display_name ?? 'User'} />
                    <AvatarFallback>{getInitials(user.user_metadata?.display_name || user.email)}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Ouvrir le menu utilisateur</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.user_metadata?.display_name || user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>Profil</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Se Déconnecter</DropdownMenuItem>
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