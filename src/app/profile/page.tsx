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
import { Calendar, Clock, Edit, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default async function ProfilePage() {
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
    .gte('date', new Date().toISOString()) // Fetch only upcoming appointments
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  const upcomingAppointments = bookings || [];
  const nextAppointment = upcomingAppointments[0];

  const getAvatarFallback = (name: string) => {
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userName = user.user_metadata?.full_name || 'Utilizador';
  const userEmail = user.email || '';
  const userAvatar = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
        <Avatar className="w-24 h-24 border-4 border-accent">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="text-3xl">
            {getAvatarFallback(userName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-muted-foreground text-lg">Bem-vindo(a) de volta,</p>
          <h1 className="text-4xl font-headline font-bold text-primary">
            {userName}
          </h1>
          <p className="text-muted-foreground mt-1">{userEmail}</p>
        </div>
        <Button variant="outline" size="icon" className="md:ml-auto">
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar Perfil</span>
        </Button>
      </div>

      {nextAppointment && (
        <Card className="mb-8 bg-accent/10 border-accent">
          <CardHeader className="flex flex-row items-center gap-4">
            <Sparkles className="w-8 h-8 text-accent" />
            <div>
              <CardDescription>O seu próximo momento de bem-estar</CardDescription>
              <CardTitle className="text-2xl font-headline text-accent">
                {services.find((s) => s.id === nextAppointment.service_id)?.name}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-center">
              Falta{' '}
              {formatDistanceToNow(new Date(`${nextAppointment.date}T${nextAppointment.time}`), {
                locale: ptBR,
                addSuffix: true,
              })}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">
            Meus Agendamentos Futuros
          </CardTitle>
          <CardDescription>
            Veja seus próximos agendamentos confirmados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appt, index) => {
                const service = services.find((s) => s.id === appt.service_id);
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
                              {format(new Date(appt.date), 'PPP', { locale: ptBR, timeZone: 'UTC' })}
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
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                    </div>
                    {index < upcomingAppointments.length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Você ainda não tem agendamentos futuros.
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
