'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle, PlusCircle, Trash2, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
import { ResponsiveDialog } from '@/components/responsive-dialog';
import type { User } from '@supabase/supabase-js';

export interface Appointment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  service_name: string;
  date: string; // ISO String
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
  payment_method: 'card' | 'minutes' | 'reception';
}

const AppointmentCard = ({ appointment, onCancel, onReschedule }: { appointment: Appointment, onCancel: () => void, onReschedule: () => void }) => {
  const statusConfig = {
    Confirmado: { icon: <AlertCircle className="h-4 w-4 text-blue-500" />, color: 'bg-blue-100 text-blue-800' },
    Concluído: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'bg-green-100 text-green-800' },
    Cancelado: { icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'bg-red-100 text-red-800' },
  };

  const appointmentDate = new Date(appointment.date);
  const isFutureAndConfirmed = appointment.status === 'Confirmado' && appointmentDate > new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{appointment.service_name}</CardTitle>
        <Badge variant="outline" className={`w-fit ${statusConfig[appointment.status].color}`}>
          {statusConfig[appointment.status].icon}
          <span className="ml-1">{appointment.status}</span>
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm sm:text-base">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
          <p>{format(appointmentDate, "EEEE, d 'de' MMMM yyyy", { locale: fr })}</p>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
          <p>{format(appointmentDate, "HH:mm")} - {appointment.duration} minutes</p>
        </div>
      </CardContent>
      {isFutureAndConfirmed && (
        <CardFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full" onClick={onReschedule}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Replanifier
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Annuler
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Votre rendez-vous pour {appointment.service_name} sera annulé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Garder le rendez-vous</AlertDialogCancel>
                        <AlertDialogAction onClick={onCancel}>Confirmer l'annulation</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
};

export default function AppointmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;
        
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setUser(currentUser);
        setIsLoading(true);

        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false });

        if (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger vos rendez-vous."});
        } else {
            setAppointments(data as Appointment[] || []);
        }
        setIsLoading(false);

        const channel = supabase
          .channel(`public:appointments:user_id=eq.${currentUser.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'appointments',
              filter: `user_id=eq.${currentUser.id}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setAppointments((prev) => [payload.new as Appointment, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
              } else if (payload.eventType === 'UPDATE') {
                setAppointments((prev) =>
                  prev.map((app) =>
                    app.id === payload.new.id ? (payload.new as Appointment) : app
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setAppointments((prev) =>
                  prev.filter((app) => app.id !== (payload.old as any).id)
                );
              }
            }
          )
          .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    checkUserAndFetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, toast]);


  const handleBookingComplete = useCallback(() => {
    setIsSchedulerOpen(false);
    setAppointmentToReschedule(null);
    // Realtime will handle the list update, no need to manually fetch.
  }, []);
  
  const handleOpenNewScheduler = () => {
    setAppointmentToReschedule(null);
    setIsSchedulerOpen(true);
  }

  const handleOpenReschedule = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
    setIsSchedulerOpen(true);
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!user) return;
    try {
        const { error } = await supabase.from('appointments').update({ status: 'Cancelado' }).eq('id', appointmentId);
        if (error) throw error;
        toast({
            title: "Rendez-vous annulé",
            description: "Votre rendez-vous a été annulé avec succès.",
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erreur lors de l'annulation",
            description: "Impossible d'annuler le rendez-vous. Veuillez réessayer.",
        });
        console.error("Error cancelling appointment: ", error);
    }
  }
  
  const { futureAppointments, pastAppointments } = useMemo(() => {
    if (!appointments) return { futureAppointments: [], pastAppointments: [] };
    const now = new Date();
    const future = appointments.filter(a => new Date(a.date) >= now);
    const past = appointments.filter(a => new Date(a.date) < now);
    future.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { futureAppointments: future, pastAppointments: past };
  }, [appointments]);
  
  const handleDialogChange = useCallback((isOpen: boolean) => {
    setIsSchedulerOpen(isOpen);
    if (!isOpen) {
      setAppointmentToReschedule(null);
    }
  }, []);

  const renderAppointments = (apps: Appointment[], type: 'future' | 'past') => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        )
    }

    if(apps.length === 0) {
        return (
            <Card className="text-center p-8">
                <p className="text-muted-foreground">
                    {type === 'future' ? 'Vous n’avez aucun rendez-vous à venir.' : 'Vous n’avez aucun rendez-vous passé.'}
                </p>
                {type === 'future' && (
                    <Button onClick={handleOpenNewScheduler} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Prendre votre premier rendez-vous
                    </Button>
                )}
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

  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }
  
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-6 gap-4">
              <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 shrink-0">
                      <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h1 className="text-2xl sm:text-3xl font-bold">Mes Rendez-vous</h1>
              </div>
              <div className="w-full sm:w-auto">
                  <Button onClick={handleOpenNewScheduler} className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Prendre un rendez-vous
                  </Button>
              </div>
          </div>
          
           <ResponsiveDialog
                isOpen={isSchedulerOpen}
                onOpenChange={handleDialogChange}
                title={appointmentToReschedule ? 'Replanifier le rendez-vous' : 'Nouveau Rendez-vous'}
                description={appointmentToReschedule ? 'Choisissez une nouvelle date et heure pour votre service.' : 'Suivez les étapes pour planifier votre prochain service.'}
            >
                <AppointmentScheduler 
                    onBookingComplete={handleBookingComplete}
                    appointmentToReschedule={appointmentToReschedule} 
                />
            </ResponsiveDialog>

          <Tabs defaultValue="future">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="future">Futurs</TabsTrigger>
              <TabsTrigger value="past">Passés</TabsTrigger>
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
