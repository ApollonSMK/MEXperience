import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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
import {
  Calendar,
  Clock,
  Edit,
  Sparkles,
  Award,
  History,
  Repeat,
} from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsageChart } from '@/components/usage-chart';

async function getProfileData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('time', { ascending: false });

  const now = new Date();
  const upcomingAppointments =
    bookings?.filter((b) => !isPast(new Date(`${b.date}T${b.time}`)))
      .reverse() || [];
  const pastAppointments =
    bookings?.filter((b) => isPast(new Date(`${b.date}T${b.time}`))) || [];

  // Mock data for subscription
  const subscription = {
    planName: 'Prata',
    minutesUsed: 40,
    minutesTotal: 90,
  };

  return {
    user,
    upcomingAppointments,
    pastAppointments,
    subscription,
  };
}

const getAvatarFallback = (name: string) => {
  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const AppointmentList = ({
  appointments,
}: {
  appointments: {
    id: any;
    service_id: string;
    date: string;
    time: string;
    status: string;
  }[];
}) => {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nenhum agendamento para mostrar.
        </p>
        <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/booking">Agendar Agora</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {appointments.map((appt, index) => {
        const service = services.find((s) => s.id === appt.service_id);
        return (
          <div key={appt.id}>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-center gap-4">
                {service && (
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <service.icon className="w-6 h-6 text-accent flex-shrink-0" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{service?.name}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />{' '}
                      {format(new Date(`${appt.date}T00:00:00`), 'PPP', {
                        locale: ptBR,
                      })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {appt.time}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                 <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    appt.status === 'Confirmado'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {appt.status}
                </span>
                { isPast(new Date(`${appt.date}T${appt.time}`)) && (
                    <Button variant="outline" size="sm">
                        <Repeat className="mr-2 h-3 w-3"/>
                        Reagendar
                    </Button>
                )}
              </div>
            </div>
            {index < appointments.length - 1 && <Separator className="mt-6" />}
          </div>
        );
      })}
    </div>
  );
};

export default async function ProfilePage() {
  const { user, upcomingAppointments, pastAppointments, subscription } =
    await getProfileData();
  const nextAppointment = upcomingAppointments[0];

  const userName = user.user_metadata?.full_name || 'Utilizador';
  const userEmail = user.email || '';
  const userAvatar =
    user.user_metadata?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName
    )}&background=random`;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12">
        <Avatar className="w-24 h-24 border-4 border-accent">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="text-3xl">
            {getAvatarFallback(userName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <p className="text-muted-foreground text-lg">
            Bem-vindo(a) de volta,
          </p>
          <h1 className="text-4xl font-headline font-bold text-primary">
            {userName}
          </h1>
          <p className="text-muted-foreground mt-1">{userEmail}</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
            <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
                <Award className="h-4 w-4 mr-2" />
                Gerir Subscrição
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {nextAppointment && (
          <Card className="lg:col-span-1 bg-accent/10 border-accent">
            <CardHeader className="flex flex-row items-center gap-4">
              <Sparkles className="w-8 h-8 text-accent" />
              <div>
                <CardDescription>Próximo Momento</CardDescription>
                <CardTitle className="text-xl font-headline text-accent">
                  {
                    services.find((s) => s.id === nextAppointment.service_id)
                      ?.name
                  }
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-center">
                Falta{' '}
                {formatDistanceToNow(
                  new Date(
                    `${nextAppointment.date}T${nextAppointment.time}`
                  ),
                  {
                    locale: ptBR,
                    addSuffix: true,
                  }
                )}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline text-primary flex items-center gap-2">
                    <Award className="w-5 h-5"/>
                    Minha Subscrição
                </CardTitle>
                <CardDescription>Plano {subscription.planName}</CardDescription>
            </CardHeader>
            <CardContent>
                <UsageChart 
                    used={subscription.minutesUsed} 
                    total={subscription.minutesTotal}
                />
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <History className="w-6 h-6" />
            Meus Agendamentos
          </CardTitle>
          <CardDescription>
            Veja seus próximos agendamentos e histórico de sessões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Futuros</TabsTrigger>
              <TabsTrigger value="past">Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="pt-4">
              <AppointmentList appointments={upcomingAppointments} />
            </TabsContent>
            <TabsContent value="past" className="pt-4">
              <AppointmentList appointments={pastAppointments} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
