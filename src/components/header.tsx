'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import { supabase } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Shield, Menu, Calendar, Sparkles, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { User } from '@supabase/supabase-js';
import { ResponsiveDialog } from './responsive-dialog';
import { AppointmentScheduler } from './appointment-scheduler';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async (currentUser: User) => {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', currentUser.id)
            .single();

        if (!error && profile) {
            setIsAdmin(profile.is_admin);
        }
        setIsLoading(false);
    };
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchUserProfile(currentUser);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };
  
  const handleBookingComplete = useCallback(() => {
    setIsSchedulerOpen(false);
    toast({
        title: "Agendamento Concluído!",
        description: "O seu agendamento foi confirmado com sucesso.",
    });
  }, [toast]);
  
  const handleOpenScheduler = () => {
    if (!user) {
      setIsLoginPromptOpen(true);
    } else {
      setIsSchedulerOpen(true);
    }
  }

  const handleQuickSchedule = () => {
    setIsLoginPromptOpen(false);
    setIsSchedulerOpen(true);
  }

  const handleLogin = () => {
    setIsLoginPromptOpen(false);
    router.push('/login');
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6 h-14 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Link
                href="/"
                className="flex items-center justify-start text-lg font-bold"
                prefetch={false}
              >
                M.E Experience
              </Link>
          </div>
          <nav className="hidden lg:flex gap-4 sm:gap-6">
            <Link
              href="/"
              className="text-sm font-medium hover:underline underline-offset-4"
              prefetch={false}
            >
              Accueil
            </Link>
            <Link
              href="/#services"
              className="text-sm font-medium hover:underline underline-offset-4"
              prefetch={false}
            >
              Services
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium hover:underline underline-offset-4"
              prefetch={false}
            >
              Abonnements
            </Link>
            <Link
              href="/#about"
              className="text-sm font-medium hover:underline underline-offset-4"
              prefetch={false}
            >
              À Propos
            </Link>
            <Link
              href="/#contact"
              className="text-sm font-medium hover:underline underline-offset-4"
              prefetch={false}
            >
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" onClick={handleOpenScheduler}>
                <button>
                    <Calendar className="h-5 w-5" />
                    <span className="sr-only">Agendar um Serviço</span>
                </button>
            </Button>
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button asChild variant="ghost" size="icon">
                    <Link href="/admin">
                      <Shield className="h-5 w-5" />
                      <span className="sr-only">Admin Panel</span>
                    </Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.user_metadata?.photo_url ?? ''} alt={user.user_metadata?.display_name ?? 'User'} />
                        <AvatarFallback>{getInitials(user.user_metadata?.display_name || user.email)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.user_metadata?.display_name || 'Utilisateur'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profil</span>
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Déconnexion</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden lg:block">
                  <Button asChild variant="outline">
                      <Link href="/login">Connexion</Link>
                  </Button>
              </div>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu de Navegação</SheetTitle>
                  <SheetDescription>
                    Navegue pelas diferentes seções do site.
                  </SheetDescription>
                </SheetHeader>
                <nav className="grid gap-6 text-lg font-medium mt-10">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-lg font-semibold"
                    prefetch={false}
                  >
                    <span className="font-bold text-lg">M.E Experience</span>
                  </Link>
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-foreground"
                    prefetch={false}
                  >
                    Accueil
                  </Link>
                  <Link
                    href="/#services"
                    className="text-muted-foreground hover:text-foreground"
                    prefetch={false}
                  >
                    Services
                  </Link>
                  <Link
                    href="/#pricing"
                    className="text-muted-foreground hover:text-foreground"
                    prefetch={false}
                  >
                    Abonnements
                  </Link>
                  <Link
                    href="/#about"
                    className="text-muted-foreground hover:text-foreground"
                    prefetch={false}
                  >
                    À Propos
                  </Link>
                  <Link
                    href="/#contact"
                    className="text-muted-foreground hover:text-foreground"
                    prefetch={false}
                  >
                    Contact
                  </Link>
                </nav>
                {!user && (
                  <div className="absolute bottom-4 right-4 left-4">
                      <Button asChild className="w-full">
                          <Link href="/login">Connexion</Link>
                      </Button>
                  </div>
                  )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
       <ResponsiveDialog
            isOpen={isSchedulerOpen}
            onOpenChange={setIsSchedulerOpen}
            title={'Nouveau Rendez-vous'}
            description={'Suivez les étapes pour planifier votre prochain service.'}
        >
            <AppointmentScheduler 
                onBookingComplete={handleBookingComplete}
            />
        </ResponsiveDialog>

        <AlertDialog open={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Comment souhaitez-vous continuer ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Vous pouvez prendre un rendez-vous rapide en tant qu'invité, ou vous connecter pour profiter de tous les avantages de votre compte.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                    <Button onClick={handleQuickSchedule}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Agendamento Rápido (sem conta)
                    </Button>
                    <Button variant="secondary" onClick={handleLogin}>
                         <UserPlus className="mr-2 h-4 w-4" />
                        Login ou Registro
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
