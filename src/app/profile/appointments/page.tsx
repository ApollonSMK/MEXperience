'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AppointmentScheduler } from '@/components/appointment-scheduler';
import { Skeleton } from '@/components/ui/skeleton';


interface Appointment {
  id: string;
  serviceName: string;
  date: Timestamp;
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
}

const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
  const statusConfig = {
    Confirmado: { icon: <AlertCircle className="h-4 w-4 text-blue-500" />, color: 'bg-blue-100 text-blue-800' },
    Concluído: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'bg-green-100 text-green-800' },
    Cancelado: { icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'bg-red-100 text-red-800' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{appointment.serviceName}</CardTitle>
        <Badge variant="outline" className={`w-fit ${statusConfig[appointment.status].color}`}>
          {statusConfig[appointment.status].icon}
          <span className="ml-1">{appointment.status}</span>
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <p>{format(appointment.date.toDate(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: fr })}</p>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <p>{format(appointment.date.toDate(), "HH:mm")} - {appointment.duration} minutes</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AppointmentsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'appointments'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: appointments, isLoading, mutate } = useCollection<Appointment>(appointmentsQuery);

  const { futureAppointments, pastAppointments } = useMemo(() => {
    if (!appointments) return { futureAppointments: [], pastAppointments: [] };
    const now = new Date();
    return {
      futureAppointments: appointments.filter(a => a.date.toDate() >= now),
      pastAppointments: appointments.filter(a => a.date.toDate() < now),
    };
  }, [appointments]);

  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }
  
  const handleBookingComplete = () => {
    setIsSchedulerOpen(false);
    mutate(); // Re-fetch appointments
  }

  const renderAppointments = (apps: Appointment[], type: 'future' | 'past') => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    if(apps.length === 0) {
        return (
            <Card className="text-center p-8">
                <p className="text-muted-foreground">
                    {type === 'future' ? 'Você não tem nenhum agendamento futuro.' : 'Você não tem nenhum agendamento passado.'}
                </p>
            </Card>
        )
    }

    return apps.map(app => <AppointmentCard key={app.id} appointment={app} />);
  }


  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold">Meus Agendamentos</h1>
            </div>
             <Dialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Fazer um Agendamento
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Novo Agendamento</DialogTitle>
                        <DialogDescription>
                            Siga os passos para agendar o seu próximo serviço.
                        </DialogDescription>
                    </DialogHeader>
                    <AppointmentScheduler onBookingComplete={handleBookingComplete} />
                </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="future">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="future">Futuros</TabsTrigger>
              <TabsTrigger value="past">Passados</TabsTrigger>
            </TabsList>
            <TabsContent value="future" className="mt-6">
              <div className="space-y-4">
                {renderAppointments(futureAppointments, 'future')}
              </div>
            </TabsContent>
            <TabsContent value="past" className="mt-6">
              <div className="space-y-4">
                {renderAppointments(pastAppointments, 'past')}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
