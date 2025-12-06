'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Shield, Menu, X, LayoutDashboard, Calendar, Settings, Gift } from 'lucide-react';
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
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function Header() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      (event: AuthChangeEvent, session: Session | null) => {
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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6 h-14 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center justify-start h-full">
            <Link href="/" className="flex items-center h-full" prefetch={false}>
              <Image src="https://supabase.me-experience.lu/storage/v1/object/public/images/Logo/logoblack1.png" alt="M.E Experience Logo" width={60} height={15} className="object-contain" />
            </Link>
          </div>
          <nav className="hidden lg:flex gap-4 sm:gap-6">
            <Link
              href="/"
              className="text-sm font-medium relative after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full hover:after:left-0"
              prefetch={false}
            >
              Accueil
            </Link>
            <Link href="/services" className="text-sm font-medium hover:text-primary transition-colors">
              Services
            </Link>
            <Link href="/cadeaux" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Gift className="h-4 w-4" /> Cadeaux
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Tarifs
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium relative after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full hover:after:left-0"
              prefetch={false}
            >
              À Propos
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium relative after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full hover:after:left-0"
              prefetch={false}
            >
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="transition-transform hover:scale-110">
                <Link href="/reserver">
                    <Image src="https://supabase.me-experience.lu/storage/v1/object/public/images/Icons/Calendar.svg" alt="Réserver" width={24} height={24} />
                    <span className="sr-only">Réserver</span>
                </Link>
            </Button>
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
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
                    <DropdownMenuItem asChild>
                      <Link href="/profile/gift-cards">
                        <Gift className="mr-2 h-4 w-4" />
                        <span>Mes Cartes Cadeaux</span>
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
                <Button asChild variant="ghost" size="icon" className="transition-transform hover:scale-110">
                    <Link href="/login">
                        <Image src="https://supabase.me-experience.lu/storage/v1/object/public/images/Icons/Login.svg" alt="Connexion" width={24} height={24} />
                        <span className="sr-only">Connexion</span>
                    </Link>
                </Button>
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
                     <Image src="https://supabase.me-experience.lu/storage/v1/object/public/images/Logo/logoblack1.png" alt="M.E Experience Logo" width={60} height={15} className="object-contain"/>
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
                            href="/cadeaux"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            prefetch={false}
                        >
                            Cadeaux
                        </Link>
                        <Link
                            href="/pricing"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            prefetch={false}
                        >
                            Tarifs
                        </Link>
                        <Link
                            href="/about"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            prefetch={false}
                        >
                            À Propos
                        </Link>
                        <Link
                            href="/contact"
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
    </>
  );
}