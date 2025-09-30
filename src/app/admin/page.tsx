import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CalendarCheck, ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';

const adminMenuItems = [
  {
    title: 'Gerir Agendamentos',
    description: 'Veja e gira todos os agendamentos.',
    icon: CalendarCheck,
    href: '/admin/bookings',
  },
  {
    title: 'Gerir Utilizadores',
    description: 'Veja e gira todos os utilizadores.',
    icon: Users,
    href: '#', // Placeholder
  },
];

export default async function AdminPage() {
  return (
    <div className="container mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">
          Centro de Administração
        </h1>
        <p className="mt-2 text-muted-foreground">
          Escolha uma opção abaixo para começar a gerir a plataforma.
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
