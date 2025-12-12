'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  CalendarPlus, 
  Banknote, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Gift, 
  User,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
  external?: boolean;
  highlight?: boolean;
}

export function BottomNav() {
  const pathname = usePathname();

  // Não mostrar no painel de admin ou na página de scan
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/scan')) {
    return null;
  }

  const isProfile = pathname?.startsWith('/profile');

  // Menu Público (Visitantes)
  const publicMenu: MenuItem[] = [
    {
      label: 'Ligar',
      icon: Phone,
      href: 'tel:+352621123456', // Substitua pelo número real se necessário
      external: true
    },
    {
      label: 'Email',
      icon: Mail,
      href: 'mailto:info@me-experience.lu', // Substitua pelo email real
      external: true
    },
    {
      label: 'Réserver',
      icon: CalendarPlus,
      href: '/reserver',
      highlight: true
    },
    {
      label: 'Tarifs',
      icon: Banknote,
      href: '/abonnements'
    },
    {
      label: 'Itinéraire',
      icon: MapPin,
      href: 'https://maps.google.com/?q=M.E+Experience+Luxembourg', // Link genérico, ajuste se necessário
      external: true
    }
  ];

  // Menu Privado (Área de Cliente)
  const profileMenu: MenuItem[] = [
    {
      label: 'RDV',
      icon: Calendar,
      href: '/profile/appointments'
    },
    {
      label: 'Abonnement',
      icon: CreditCard,
      href: '/profile/subscription'
    },
    {
      label: 'Réserver',
      icon: CalendarPlus,
      href: '/reserver',
      highlight: true
    },
    {
      label: 'Cadeaux',
      icon: Gift,
      href: '/profile/gift-cards'
    },
    {
      label: 'Profil',
      icon: User,
      href: '/profile/details' // Alterado para ir direto aos detalhes ou menu principal
    }
  ];

  const menuItems = isProfile ? profileMenu : publicMenu;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-200 pb-safe-area-bottom shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-1">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          // Item Especial (Destaque - geralmente o do meio "Réserver")
          if (item.highlight) {
            return (
              <Link 
                key={index} 
                href={item.href}
                className="relative -top-5"
              >
                <div className="h-14 w-14 rounded-full bg-slate-900 text-white shadow-lg flex flex-col items-center justify-center border-4 border-white">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-medium text-center block mt-1 text-slate-900">
                  {item.label}
                </span>
              </Link>
            );
          }

          // Items Normais
          return (
            <Link
              key={index}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform",
                isActive ? "text-primary" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-current/10")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}