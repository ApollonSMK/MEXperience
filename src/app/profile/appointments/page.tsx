'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle, PlusCircle, Trash2, CalendarClock, QrCode, Hourglass, FileText } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import QRCode from 'qrcode.react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Service, PricingTier } from '@/app/admin/services/page';


export interface Appointment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  service_name: string;
  date: string; // ISO String
  duration: number;
  status: 'Pendente' | 'Confirmado' | 'Concluído' | 'Cancelado';
  payment_method: 'card' | 'minutes' | 'reception';
}

const AppointmentCard = ({ appointment, onCancel, onReschedule }: { appointment: Appointment, onCancel: () => void, onReschedule: () => void }) => {
  const statusConfig = {
    Pendente: { icon: <Hourglass className="h-4 w-4 text-yellow-500" />, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
    Confirmado: { icon: <AlertCircle className="h-4 w-4 text-blue-500" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
    Concluído: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
    Cancelado: { icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  };

  const appointmentDate = new Date(appointment.date);
  const isFutureAndConfirmed = appointment.status === 'Confirmado' && appointmentDate > new Date();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle className="text-xl">{appointment.service_name}</CardTitle>
            <Badge variant="outline" className={`w-fit ${statusConfig[appointment.status].color} mt-2`}>
            {statusConfig[appointment.status].icon}
            <span className="ml-1">{appointment.status}</span>
            </Badge>
        </div>
        {isFutureAndConfirmed && (
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <QrCode className="h-6 w-6" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4">
                    <div className="flex flex-col items-center gap-2">
                        <QRCode value={appointment.id} size={128} />
                        <p className="text-xs text-muted-foreground">Présentez ce code à la réception</p>
                    </div>
                </PopoverContent>
            </Popover>
        )}
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


const PaymentHistoryTable = ({ appointments, services }: { appointments: Appointment[], services: Service[] }) => {

    const paidAppointments = useMemo(() => {
        return appointments
            .filter(app => app.status === 'Concluído' && (app.payment_method === 'card' || app.payment_method === 'reception'))
            .map(app => {
                const service = services.find(s => s.name === app.service_name);
                const tier = service?.pricing_tiers.find(t => t.duration === app.duration);
                return { ...app, price: tier?.price };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [appointments, services]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historique des Paiements de Services</CardTitle>
                <CardDescription>Liste de tous les services que vous avez payés individuellement.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Méthode</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paidAppointments.length > 0 ? (
                            paidAppointments.map(app => (
                                <TableRow key={app.id}>
                                    <TableCell>{format(new Date(app.date), 'd MMMM yyyy', { locale: fr })}</TableCell>
                                    <TableCell className="font-medium">{app.service_name} ({app.duration} min)</TableCell>
                                    <TableCell className="capitalize">{app.payment_method === 'card' ? 'Carte' : 'Réception'}</TableCell>
                                    <TableCell className="text-right">
                                        {app.price !== undefined ? `€${app.price.toFixed(2)}` : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Aucun paiement de service trouvé.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};


export default function AppointmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      const appointmentsPromise = supabase
        .from('appointments')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });
      
      const servicesPromise = supabase.from('services').select('*');

      const [{ data: appointmentsData, error: appointmentsError }, { data: servicesData, error: servicesError }] = await Promise.all([
          appointmentsPromise,
          servicesPromise
      ]);

      if (appointmentsError) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger vos rendez-vous." });
      } else {
        setAppointments(appointmentsData as Appointment[] || []);
      }
      
      if (servicesError) {
         toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les détails des services." });
      } else {
        setServices(servicesData as Service[] || []);
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
              setAppointments((prev) => [payload.new as Appointment, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
    };

    checkUserAndFetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (event === "SIGNED_IN" && session?.user) {
            setUser(session.user);
            checkUserAndFetchData();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, toast, supabase]);

  const handleOpenReschedule = (appointment: Appointment) => {
    router.push('/agendar');
    sessionStorage.setItem('rescheduleAppointment', JSON.stringify(appointment));
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!user) return;
    try {
        // Obter detalhes do agendamento antes de cancelar (ou do estado local) para o email
        const appToCancel = appointments.find(a => a.id === appointmentId);

        const { error } = await supabase.from('appointments').update({ status: 'Cancelado' }).eq('id', appointmentId);
        if (error) throw error;

        // --- EMAIL NOTIFICATION (CANCELLATION) ---
        if (appToCancel) {
             await fetch('/api/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'cancellation',
                    to: appToCancel.user_email,
                    data: {
                        userName: appToCancel.user_name,
                        serviceName: appToCancel.service_name,
                        date: appToCancel.date,
                    }
                })
            });
        }
        // -----------------------------------------

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
    const now = new Date();
    const future: Appointment[] = [];
    const past: Appointment[] = [];

    appointments.forEach(app => {
        const appDate = new Date(app.date);
        if (app.status === 'Cancelado' || app.status === 'Concluído' || appDate < now) {
            past.push(app);
        } else {
            future.push(app);
        }
    });

    future.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { futureAppointments: future, pastAppointments: past };
  }, [appointments]);

  const renderAppointments = (apps: Appointment[], type: 'future' | 'past') => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        )
    }

    if(apps.length === 0) {
        return (
            <Card className="text-center p-8">
                <p className="text-muted-foreground">
                    {type === 'future' ? 'Vous n\'avez aucun rendez-vous à venir.' : 'Vous n\'avez aucun rendez-vous passé.'}
                </p>
                {type === 'future' && (
                    <Button onClick={() => router.push('/agendar')} className="mt-4">
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
      <main className="flex min-h-screen flex-col bg-background">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="flex items-center justify-between mb-8 gap-4">
              <div className="hidden sm:block">
                  <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full shadow-md">
                      <ArrowLeft className="h-5 w-5" />
                  </Button>
              </div>
              <div className="flex-grow flex items-center justify-end gap-2">
                   <Button variant="ghost" size="icon" onClick={() => router.back()} className="sm:hidden">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                  <Button onClick={() => router.push('/agendar')} className="w-full sm:w-auto">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Prendre un rendez-vous
                  </Button>
              </div>
          </div>
          
          <Tabs defaultValue="future">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="future">Futurs</TabsTrigger>
              <TabsTrigger value="past">Passés</TabsTrigger>
              <TabsTrigger value="payments">Paiements</TabsTrigger>
            </TabsList>
            <TabsContent value="future" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderAppointments(futureAppointments, 'future')}
              </div>
            </TabsContent>
            <TabsContent value="past" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderAppointments(pastAppointments, 'past')}
              </div>
            </TabsContent>
            <TabsContent value="payments" className="mt-6">
                <PaymentHistoryTable appointments={appointments} services={services} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}