'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Shield, Menu, Calendar, Sparkles, UserPlus, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ResponsiveDialog } from './responsive-dialog';


const LoginPromptContent = ({ onContinueAsGuest, onLogin, onCreateAccount }: { onContinueAsGuest: () => void, onLogin: () => void, onCreateAccount: () => void }) => (
    <div className="p-2 sm:p-6">
        <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Comment souhaitez-vous continuer ?</h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-2">Créez un compte pour gérer vos séances et profiter d'avantages exclusifs.</p>
        </div>
        
        <div className="space-y-4">
             <div className="p-6 border rounded-lg bg-background">
                <h3 className="font-bold text-lg mb-3">Créer un Compte</h3>
                 <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start"><Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" /><span>Gérez facilement vos rendez-vous.</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" /><span>Accédez à l'historique de vos séances.</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" /><span>Profitez d'offres exclusives pour les membres.</span></li>
                </ul>
                <Button className="w-full mt-6" onClick={onCreateAccount}>Créer un Compte</Button>
                 <p className="text-xs text-muted-foreground text-center mt-3">
                    Vous avez déjà un compte? <button onClick={onLogin} className="underline font-semibold hover:text-primary">Connectez-vous</button>
                </p>
            </div>
            
            <div className="relative text-center my-4">
                <span className="px-2 bg-background text-sm text-muted-foreground relative z-10">ou</span>
                <div className="absolute left-0 top-1/2 w-full h-px bg-border"></div>
            </div>

            <Button variant="outline" className="w-full" onClick={onContinueAsGuest}>
                <UserIcon className="mr-2 h-4 w-4" />
                Continuer comme Invité
            </Button>
        </div>
    </div>
);


export function Header() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

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
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };
  
  const handleOpenScheduler = () => {
    if (!user) {
      setIsLoginPromptOpen(true);
    } else {
      router.push('/agendar');
    }
  }

  const handleContinueAsGuest = () => {
    setIsLoginPromptOpen(false);
    router.push('/agendar');
  }

  const handleLogin = () => {
    setIsLoginPromptOpen(false);
    router.push('/login');
  }
  
  const handleCreateAccount = () => {
    setIsLoginPromptOpen(false);
    router.push('/signup');
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
              href="/services"
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
                    <span className="sr-only">Prendre un rendez-vous</span>
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
              <SheetContent side="left" className="flex flex-col p-0">
                <SheetHeader className="border-b p-4">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <SheetDescription className="sr-only">Main site navigation</SheetDescription>
                  <Link
                    href="/"
                    className="flex items-center gap-2 font-semibold"
                    prefetch={false}
                  >
                    M.E Experience
                  </Link>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                    <nav className="grid items-start p-4 text-sm font-medium">
                        <Link
                            href="/"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            prefetch={false}
                        >
                            Accueil
                        </Link>
                        <Link
                            href="/services"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            prefetch={false}
                        >
                            Services
                        </Link>
                        <Link
                            href="/#pricing"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            prefetch={false}
                        >
                            Abonnements
                        </Link>
                        <Link
                            href="/#about"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            prefetch={false}
                        >
                            À Propos
                        </Link>
                        <Link
                            href="/#contact"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            prefetch={false}
                        >
                            Contact
                        </Link>
                    </nav>
                </div>
                {!user && (
                  <div className="mt-auto border-t p-4">
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
        isOpen={isLoginPromptOpen}
        onOpenChange={setIsLoginPromptOpen}
        title="Options de réservation"
        description="Choisissez comment continuer."
      >
        <LoginPromptContent
          onContinueAsGuest={handleContinueAsGuest}
          onLogin={handleLogin}
          onCreateAccount={handleCreateAccount}
        />
      </ResponsiveDialog>
    </>
  );
}
