import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { User, LogIn, Menu, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';

const NavLinks = ({ className }: { className?: string }) => (
  <nav className={className}>
    <Button variant="link" asChild>
      <Link href="/">Inicio</Link>
    </Button>
    <Button variant="link" asChild>
      <Link href="/services">Serviços</Link>
    </Button>
    <Button variant="link" asChild>
      <Link href="/booking">Agendar</Link>
    </Button>
    <Button variant="link" asChild>
      <Link href="/about">Sobre Nós</Link>
    </Button>
    <Button variant="link" asChild>
      <Link href="/contact">Contactos</Link>
    </Button>
  </nav>
);

export default async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <NavLinks className="hidden md:flex items-center gap-4 text-sm" />
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>
              <form action={logout}>
                <Button variant="outline" size="icon">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Logout</span>
                </Button>
              </form>
            </>
          ) : (
            <Button
              asChild
              className="hidden md:flex"
            >
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 p-6">
                <Logo />
                <NavLinks className="flex flex-col items-start gap-4" />
                {isAuthenticated ? (
                  <div className='flex items-center gap-2'>
                     <Button variant="ghost" size="icon" asChild>
                      <Link href="/profile">
                        <User className="h-5 w-5" />
                        <span className="sr-only">Profile</span>
                      </Link>
                    </Button>
                    <form action={logout}>
                      <Button variant="outline">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </Button>
                    </form>
                  </div>
                ) : (
                  <Button
                    asChild
                  >
                    <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" /> Login
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
