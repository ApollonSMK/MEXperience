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

interface Appointment {
  id: string;
  serviceName: string;
  date: Timestamp;
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
}

// Mock data - replace with Firestore data fetching
const mockAppointments: Appointment[] = [
    {
      id: '1',
      serviceName: 'Hydromassage',
      date: Timestamp.fromDate(new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000)), // In 2 days
      duration: 50,
      status: 'Confirmado',
    },
    {
      id: '2',
      serviceName: 'Collagen Boost',
      date: Timestamp.fromDate(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)), // In 7 days
      duration: 30,
      status: 'Confirmado',
    },
    {
      id: '3',
      serviceName: 'Dôme Infrarouge',
      date: Timestamp.fromDate(new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
      duration: 40,
      status: 'Concluído',
    },
     {
      id: '4',
      serviceName: 'Banc Solaire',
      date: Timestamp.fromDate(new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
      duration: 15,
      status: 'Concluído',
    },
     {
      id: '5',
      serviceName: 'Hydromassage',
      date: Timestamp.fromDate(new Date(new Date().getTime() - 12 * 24 * 60 * 60 * 1000)), // 12 days ago
      duration: 50,
      status: 'Cancelado',
    },
];


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

  // This part will be used once data fetching is live
  /*
  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'appointments'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: appointments, isLoading } = useCollection<Appointment>(appointmentsQuery);
  */

  // Using mock data for now
  const appointments = mockAppointments;
  const isLoading = false;

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
    // Here you could also trigger a re-fetch of the appointments
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
                {isLoading && <p>Carregando agendamentos...</p>}
                {!isLoading && futureAppointments.length === 0 && (
                  <Card className="text-center p-8">
                    <p className="text-muted-foreground">Você não tem nenhum agendamento futuro.</p>
                  </Card>
                )}
                {futureAppointments.map(app => <AppointmentCard key={app.id} appointment={app} />)}
              </div>
            </TabsContent>
            <TabsContent value="past" className="mt-6">
              <div className="space-y-4">
                {isLoading && <p>Carregando agendamentos...</p>}
                {!isLoading && pastAppointments.length === 0 && (
                  <Card className="text-center p-8">
                    <p className="text-muted-foreground">Você não tem nenhum agendamento passado.</p>
                  </Card>
                )}
                {pastAppointments.map(app => <AppointmentCard key={app.id} appointment={app} />)}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
