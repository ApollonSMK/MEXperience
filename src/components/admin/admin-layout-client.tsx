
'use client';

import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Users,
  PanelLeft,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { logout } from '@/app/auth/actions';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Logo } from '../logo';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

const adminNavLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Agendamentos', icon: Calendar },
  { href: '/admin/users', label: 'Utilizadores', icon: Users },
];

const getInitials = (name: string | undefined | null) => {
  if (!name) return '';
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.length > 2 ? initials.substring(0, 2) : initials;
};

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: SupabaseUser;
}

function NavContent({
  isCollapsed,
  onLinkClick,
}: {
  isCollapsed: boolean;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <div
        data-collapsed={isCollapsed}
        className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
      >
        <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
          {adminNavLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return isCollapsed ? (
              <Tooltip key={link.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                    onClick={onLinkClick}
                  >
                    <link.icon className="h-5 w-5" />
                    <span className="sr-only">{link.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-4">
                  {link.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  isActive && 'bg-muted text-primary'
                )}
                onClick={onLinkClick}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </TooltipProvider>
  );
}

export function AdminLayoutClient({
  children,
  user,
}: AdminLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-full bg-background">
        {/* Sidebar for Desktop */}
        <aside
            className={cn(
            'hidden md:flex flex-col border-r bg-background transition-all duration-300 ease-in-out',
            isCollapsed ? 'w-20' : 'w-64'
            )}
        >
            <div className="flex h-16 items-center justify-between px-4">
                {!isCollapsed && <Logo />}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="shrink-0"
                >
                    {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                </Button>
            </div>
            <div className="flex-grow">
                <NavContent isCollapsed={isCollapsed} />
            </div>
            <div className="mt-auto p-2 border-t">
                <div
                    className={cn(
                    'flex items-center p-2',
                    isCollapsed ? 'justify-center' : 'justify-between'
                    )}
                >
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 overflow-hidden">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={user.user_metadata?.picture} alt={user.user_metadata?.full_name} />
                                <AvatarFallback>{getInitials(user.user_metadata?.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold truncate">{user.user_metadata?.full_name}</span>
                                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                            </div>
                        </div>
                    )}
                     <form action={logout}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <LogOut className="h-4 w-4" />
                                <span className="sr-only">Logout</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Logout</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    </form>
                </div>
            </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header for Mobile */}
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:hidden">
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="sm:max-w-xs p-0">
                        <div className="flex h-full flex-col">
                        <div className="flex h-16 items-center border-b px-6">
                            <Logo />
                        </div>
                        <NavContent isCollapsed={false} onLinkClick={() => setIsMobileOpen(false)} />
                        </div>
                    </SheetContent>
                </Sheet>

                <div className="flex items-center gap-2">
                    <Link href="/profile">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user.user_metadata?.picture} alt={user.user_metadata?.full_name} />
                            <AvatarFallback>{getInitials(user.user_metadata?.full_name)}</AvatarFallback>
                        </Avatar>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-6 overflow-auto">
                {children}
            </main>
        </div>
    </div>
  );
}
