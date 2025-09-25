import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { services } from '@/lib/services';
import { Calendar, Clock, Edit } from 'lucide-react';
import Link from 'next/link';

const mockUser = {
  name: 'Ana Silva',
  email: 'ana.silva@exemplo.com',
  avatarUrl: 'https://picsum.photos/seed/person1/100/100',
  avatarFallback: 'AS',
};

const mockAppointments = [
  {
    id: 1,
    serviceId: 'hydromassage',
    date: '2024-08-15',
    time: '14:00',
    status: 'Confirmado',
  },
  {
    id: 2,
    serviceId: 'collagen-boost',
    date: '2024-07-20',
    time: '11:00',
    status: 'Concluído',
  },
];

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
        <Avatar className="w-24 h-24 border-4 border-accent">
          <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
          <AvatarFallback className="text-3xl">
            {mockUser.avatarFallback}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-headline font-bold">{mockUser.name}</h1>
          <p className="text-muted-foreground">{mockUser.email}</p>
        </div>
        <Button variant="outline" size="icon" className="md:ml-auto">
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar Perfil</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">
            Meus Agendamentos
          </CardTitle>
          <CardDescription>
            Veja seus próximos e passados agendamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {mockAppointments.length > 0 ? (
              mockAppointments.map((appt, index) => {
                const service = services.find((s) => s.id === appt.serviceId);
                return (
                  <div key={appt.id}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {service && (
                          <service.icon className="w-10 h-10 text-accent flex-shrink-0" />
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">
                            {service?.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />{' '}
                              {new Date(appt.date).toLocaleDateString('pt-BR', {
                                timeZone: 'UTC',
                              })}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> {appt.time}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            appt.status === 'Confirmado'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                    </div>
                    {index < mockAppointments.length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Você ainda não tem agendamentos.
                </p>
                <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/booking">Agendar Agora</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
