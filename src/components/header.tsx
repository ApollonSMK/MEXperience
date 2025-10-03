
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { User, LogIn, Menu, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { logout } from '@/app/auth/actions';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { BookingModal } from './booking-modal';
import React, { useEffect, useState } from 'react';
import type { Service } from '@/lib/services';
import { createClient } from '@/lib/supabase/client';


const NavLinks = ({ className, onLinkClick, services }: { className?: string; onLinkClick?: () => void, services: Service[] }) => (
  <nav className={className}>
    <Button variant="link" asChild onClick={onLinkClick}>
      <Link href="/">Inicio</Link>
    </Button>
    <Button variant="link" asChild onClick={onLinkClick}>
      <Link href="/services">Serviços</Link>
    </Button>
    <BookingModal onOpenChange={onLinkClick} services={services}>
        <Button variant="link">Agendar</Button>
    </BookingModal>
    <Button variant="link" asChild onClick={onLinkClick}>
      <Link href="/about">Sobre Nós</Link>
    </Button>
    <Button variant="link" asChild onClick={onLinkClick}>
      <Link href="/contact">Contactos</Link>
    </Button>
  </nav>
);

export default function Header({ user }: { user: SupabaseUser | null }) {
  const isAuthenticated = !!user;
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    async function fetchServices() {
        const supabase = createClient();
        const { data } = await supabase.from('services').select('*');
        if (data) {
            setServices(data as Service[]);
        }
    }
    fetchServices();
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <NavLinks className="hidden md:flex items-center gap-4 text-sm" services={services} />
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
                <NavLinks className="flex flex-col items-start gap-4" services={services} />
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
