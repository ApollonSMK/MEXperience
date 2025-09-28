import { Logo } from '@/components/logo';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Input } from './ui/input';

const footerNav = [
  { href: '/', label: 'Inicio' },
  { href: '/services', label: 'Serviços' },
  { href: '/booking', label: 'Agendar' },
  { href: '/about', label: 'Sobre Nós' },
  { href: '/contact', label: 'Contactos' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/40 mt-auto bg-card text-card-foreground">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Top Footer */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Col 1: About */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Sua experiência de bem-estar definitiva, projetada para rejuvenescer
              mente, corpo e alma.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-4">
            <h4 className="font-headline font-semibold text-primary">
              Navegação
            </h4>
            <ul className="space-y-2">
              {footerNav.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div className="space-y-4">
            <h4 className="font-headline font-semibold text-primary">
              Contactos
            </h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Rua Exemplo, 123, 1000-000 Lisboa</p>
              <p>geral@mewellness.pt</p>
              <p>+351 123 456 789</p>
            </div>
          </div>

          {/* Col 4: Newsletter */}
          <div className="space-y-4">
            <h4 className="font-headline font-semibold text-primary">
              Subscreva a nossa Newsletter
            </h4>
            <p className="text-sm text-muted-foreground">
              Receba as últimas novidades e ofertas especiais diretamente no seu
              email.
            </p>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="email"
                placeholder="Seu email"
                className="bg-background"
              />
              <Button
                type="submit"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Subscrever
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-8 py-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} M.E Wellness Experience. Todos os
            direitos reservados.
          </p>
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
      </div>
    </footer>
  );
}
