'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Home, Package2, Users, Briefcase, ClipboardList, Cake, Settings, Calendar, Clock, Menu } from 'lucide-react';
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
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import AdminContent from '@/components/admin-content';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const getInitials = (name?: string | null) => {
  return name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
    : 'U';
};

function AdminNavMenu({ onLinkClick }: { onLinkClick?: () => void }) {
    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Geral
                </h2>
                <div className="space-y-1">
                    <Link
                        href="/admin"
                        onClick={onLinkClick}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/appointments"
                        onClick={onLinkClick}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <Calendar className="h-4 w-4" />
                        Agendamentos
                    </Link>
                </div>
              </div>
              <div className="px-3 py-2">
                 <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  Gestão
                </h2>
                <div className="space-y-1">
                    <Link
                        href="/admin/users"
                        onClick={onLinkClick}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <Users className="h-4 w-4" />
                        Utilisateurs
                    </Link>
                    <Link
                        href="/admin/birthdays"
                        onClick={onLinkClick}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <Cake className="h-4 w-4" />
                        Aniversários
                    </Link>
                    <Link
                        href="/admin/services"
                        onClick={onLinkClick}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <Briefcase className="h-4 w-4" />
                        Serviços
                    </Link>
                    <Link
                        href="/admin/plans"
                        onClick={onLinkClick}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <ClipboardList className="h-4 w-4" />
                        Planos
                    </Link>
                    <Link
                        href="/admin/schedules"
                        onClick={onLinkClick}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <Clock className="h-4 w-4" />
                        Horários
                    </Link>
                </div>
              </div>
              <div className="px-3 py-2">
                 <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  Definições
                </h2>
                <div className="space-y-1">
                    <Link
                        href="/admin/settings"
                        onClick={onLinkClick}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <Settings className="h-4 w-4" />
                        Definições
                    </Link>
                </div>
              </div>
        </nav>
    )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);


  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) {
      return null;
    }
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc<any>(userDocRef);

  const isLoading = isUserLoading || isUserDocLoading === undefined || userData === undefined;
  const isAdmin = !isLoading && userData?.isAdmin === true;

  const handleSignOut = async () => {
    if (user) {
      await signOut(user.auth);
      router.push('/');
    }
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-background md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="">Painel Admin</span>
            </Link>
          </div>
          <div className="flex-1 py-2">
            <AdminNavMenu />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
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
                            <Package2 className="h-6 w-6" />
                            <span className="">Painel Admin</span>
                         </Link>
                         <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                         <SheetDescription className="sr-only">
                            Navegue pelas diferentes seções do painel de administração.
                         </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 py-2 overflow-y-auto">
                        <AdminNavMenu onLinkClick={() => setIsSheetOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>

          <div className="w-full flex-1">
            {/* Pode adicionar uma busca aqui no futuro */}
          </div>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>Perfil</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <AdminContent isLoading={isLoading} isAdmin={isAdmin}>
            {children}
          </AdminContent>
        </main>
      </div>
    </div>
  );
}
