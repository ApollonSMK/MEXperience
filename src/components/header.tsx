'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mountain, LogOut, User as UserIcon, Shield, Menu } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { doc } from "firebase/firestore";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = getAuth();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc<any>(userDocRef);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Redirect or show a message upon successful sign-out
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const getInitials = (email?: string | null) => {
    return email ? email.substring(0, 2).toUpperCase() : "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6 h-14 flex items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
           <Link
              href="/"
              className="flex items-center justify-start"
              prefetch={false}
            >
              <Mountain className="h-6 w-6" />
              <span className="sr-only">Template Genesis</span>
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
        </nav>
        <div className="flex items-center gap-2">
          {isUserLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-2">
               {userData?.isAdmin && (
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
                      <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                      <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'Utilisateur'}</p>
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
                  {userData?.isAdmin && (
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
              <nav className="grid gap-6 text-lg font-medium mt-10">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold"
                  prefetch={false}
                >
                  <Mountain className="h-6 w-6" />
                  <span className="sr-only">Template Genesis</span>
                </Link>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground"
                  prefetch={false}
                >
                  Accueil
                </Link>
                {/* Adicionar outros links aqui no futuro */}
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
  );
}
