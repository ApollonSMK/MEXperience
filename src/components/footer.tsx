import { Logo } from '@/components/logo';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <Logo />
            <p className="mt-2 text-sm text-muted-foreground">
              Sua experiência de bem-estar definitiva.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-accent">
              <Facebook />
            </a>
            <a href="#" className="text-muted-foreground hover:text-accent">
              <Instagram />
            </a>
            <a href="#" className="text-muted-foreground hover:text-accent">
              <Twitter />
            </a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} M.E Wellness Experience. Todos os
            direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
