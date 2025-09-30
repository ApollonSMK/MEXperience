
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  Calendar,
  Settings,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

async function getProfileData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return { user };
}

const menuItems = [
  {
    title: 'Dashboard',
    description: 'Veja uma visão geral da sua atividade.',
    icon: LayoutDashboard,
    href: '/profile/dashboard',
  },
  {
    title: 'Estatísticas',
    description: 'Analise o seu uso e progresso.',
    icon: BarChart3,
    href: '/profile/statistics',
  },
  {
    title: 'Subscrição',
    description: 'Gira o seu plano e faturação.',
    icon: CreditCard,
    href: '/profile/subscription',
  },
  {
    title: 'Meus Agendamentos',
    description: 'Veja e gira as suas sessões.',
    icon: Calendar,
    href: '/profile/bookings',
  },
  {
    title: 'Definições',
    description: 'Atualize os seus dados e preferências.',
    icon: Settings,
    href: '/profile/settings',
  },
];

export default async function ProfileHubPage() {
  const { user } = await getProfileData();
  const userName = user.user_metadata?.full_name || 'Utilizador';

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12">
        <p className="text-muted-foreground text-lg">Bem-vindo(a) de volta,</p>
        <h1 className="text-4xl font-headline font-bold text-primary">
          {userName}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Este é o seu centro de controlo. Escolha uma opção abaixo para
          começar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Link href={item.href} key={item.title}>
            <Card className="h-full group hover:border-accent transition-colors duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <item.icon className="w-8 h-8 text-accent" />
                  <div>
                    <CardTitle className="font-headline text-xl text-primary group-hover:text-accent">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
