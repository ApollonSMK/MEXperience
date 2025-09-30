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
  CalendarCheck,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';


async function getProfileData() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return { user };
}

const adminMenuItems = [
  {
    title: 'Dashboard',
    description: 'Visão geral do seu sistema e métricas.',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    title: 'Agendamentos',
    description: 'Gerir todos os agendamentos de clientes.',
    icon: CalendarCheck,
    href: '/admin/bookings',
  },
];


export default async function AdminHubPage() {
  const { user } = await getProfileData();
  const userName = user.user_metadata?.full_name || 'Admin';

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12">
        <p className="text-muted-foreground text-lg">Bem-vindo(a) de volta,</p>
        <h1 className="text-4xl font-headline font-bold text-primary">
          {userName}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Este é o seu centro de controlo. Escolha uma opção para gerir a plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminMenuItems.map((item) => (
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
