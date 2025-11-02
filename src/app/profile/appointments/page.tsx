'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle, PlusCircle, Trash2, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AppointmentScheduler } from '@/components/appointment-scheduler';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';


export interface Appointment {
  id: string;
  serviceName: string;
  date: Timestamp;
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
  paymentMethod: 'card' | 'minutes' | 'reception';
}

const AppointmentCard = ({ appointment, onCancel, onReschedule }: { appointment: Appointment, onCancel: () => void, onReschedule: () => void }) => {
  const statusConfig = {
    Confirmado: { icon: <AlertCircle className="h-4 w-4 text-blue-500" />, color: 'bg-blue-100 text-blue-800' },
    Concluído: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'bg-green-100 text-green-800' },
    Cancelado: { icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'bg-red-100 text-red-800' },
  };

  const isFutureAndConfirmed = appointment.status === 'Confirmado' && appointment.date.toDate() > new Date();

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
      {isFutureAndConfirmed && (
        <CardFooter className="gap-2">
            <Button variant="outline" className="w-full" onClick={onReschedule}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Reagendar
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancelar
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O seu agendamento para {appointment.serviceName} será cancelado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Manter Agendamento</AlertDialogCancel>
                        <AlertDialogAction onClick={onCancel}>Confirmar Cancelamento</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
};

export default function AppointmentsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);

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
    setAppointmentToReschedule(null);
    mutate(); // Re-fetch appointments
  }
  
  const handleOpenNewScheduler = () => {
    setAppointmentToReschedule(null);
    setIsSchedulerOpen(true);
  }

  const handleOpenReschedule = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
    setIsSchedulerOpen(true);
  }


  const handleCancelAppointment = async (appointmentId: string) => {
    if (!user || !firestore) return;
    try {
        const appointmentRef = doc(firestore, 'users', user.uid, 'appointments', appointmentId);
        await setDocumentNonBlocking(appointmentRef, { status: 'Cancelado' }, { merge: true });
        toast({
            title: "Agendamento Cancelado",
            description: "O seu agendamento foi cancelado com sucesso.",
        });
        mutate();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erro ao cancelar",
            description: "Não foi possível cancelar o agendamento. Tente novamente.",
        });
        console.error("Error cancelling appointment: ", error);
    }
  }

  const renderAppointments = (apps: Appointment[], type: 'future' | 'past') => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
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

    return apps.map(app => (
        <AppointmentCard 
            key={app.id} 
            appointment={app} 
            onCancel={() => handleCancelAppointment(app.id)}
            onReschedule={() => handleOpenReschedule(app)}
        />
    ));
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
            <Button onClick={handleOpenNewScheduler}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Fazer um Agendamento
            </Button>
          </div>
          
           <Dialog open={isSchedulerOpen} onOpenChange={(isOpen) => {
               if (!isOpen) {
                   setAppointmentToReschedule(null);
               }
               setIsSchedulerOpen(isOpen);
           }}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{appointmentToReschedule ? 'Reagendar Agendamento' : 'Novo Agendamento'}</DialogTitle>
                        <DialogDescription>
                            {appointmentToReschedule ? 'Escolha uma nova data e hora para o seu serviço.' : 'Siga os passos para agendar o seu próximo serviço.'}
                        </DialogDescription>
                    </DialogHeader>
                    <AppointmentScheduler 
                        onBookingComplete={handleBookingComplete}
                        appointmentToReschedule={appointmentToReschedule} 
                    />
                </DialogContent>
            </Dialog>

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
