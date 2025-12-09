'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle, 
    PlusCircle, Trash2, CalendarClock, QrCode, Hourglass, CreditCard, Receipt
} from 'lucide-react';
import { format, differenceInMinutes, isSameDay } from 'date-fns';
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
import type { User, RealtimePostgresChangesPayload, AuthChangeEvent, Session } from '@supabase/supabase-js';
import QRCode from 'qrcode.react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Service } from '@/app/admin/services/page';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setOrigin(window.location.origin);
    }
  }, []);

  const statusConfig = {
    Pendente: { 
        icon: <Hourglass className="h-4 w-4" />, 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        label: 'En attente'
    },
    Confirmado: { 
        icon: <CheckCircle className="h-4 w-4" />, 
        color: 'bg-primary/10 text-primary border-primary/20',
        label: 'Confirmé'
    },
    Concluído: { 
        icon: <CheckCircle className="h-4 w-4" />, 
        color: 'bg-green-100 text-green-700 border-green-200',
        label: 'Terminé'
    },
    Cancelado: { 
        icon: <XCircle className="h-4 w-4" />, 
        color: 'bg-red-100 text-red-700 border-red-200',
        label: 'Annulé'
    },
  };

  const appointmentDate = new Date(appointment.date);
  const isFutureAndConfirmed = appointment.status === 'Confirmado' && appointmentDate > new Date();

  const now = new Date();
  const minutesUntilAppointment = differenceInMinutes(appointmentDate, now);
  const hoursUntilAppointment = minutesUntilAppointment / 60;
  
  let refundAmount = appointment.duration;
  let isLateCancellation = false;

  if (isFutureAndConfirmed && appointment.payment_method === 'minutes') {
      if (hoursUntilAppointment < 24) {
          isLateCancellation = true;
          const refundRatio = Math.max(0, hoursUntilAppointment / 24); 
          refundAmount = Math.floor(appointment.duration * refundRatio);
      }
  }

  const status = statusConfig[appointment.status] || statusConfig['Pendente'];

  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
    >
        <Card className="overflow-hidden border-l-4 transition-all hover:shadow-md" style={{ borderLeftColor: appointment.status === 'Confirmado' ? '#000' : undefined }}>
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-lg leading-tight">{appointment.service_name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                             <Badge variant="outline" className={`font-medium border ${status.color} gap-1.5`}>
                                {status.icon}
                                {status.label}
                            </Badge>
                             {appointment.payment_method === 'minutes' && (
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                    Pack Minutes
                                </Badge>
                            )}
                        </div>
                    </div>
                    {isFutureAndConfirmed && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100">
                                    <QrCode className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4 border-none shadow-xl">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <QRCode value={origin ? `${origin}/admin/scan?code=${appointment.id}` : appointment.id} size={150} />
                                    </div>
                                    <p className="text-sm font-medium text-center max-w-[150px]">
                                        Présentez ce code à la réception
                                    </p>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                     <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 flex flex-col justify-center">
                        <span className="text-xs text-muted-foreground uppercase font-semibold mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Date
                        </span>
                        <span className="text-sm font-medium capitalize">
                             {format(appointmentDate, "EEEE d MMMM", { locale: fr })}
                        </span>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 flex flex-col justify-center">
                        <span className="text-xs text-muted-foreground uppercase font-semibold mb-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Heure
                        </span>
                        <span className="text-sm font-medium">
                            {format(appointmentDate, "HH:mm")} <span className="text-muted-foreground font-normal">({appointment.duration} min)</span>
                        </span>
                     </div>
                </div>

                {isFutureAndConfirmed && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="outline" className="flex-1" onClick={onReschedule}>
                            <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
                            Modifier
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Annuler
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Annuler le rendez-vous ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Vous êtes sur le point d'annuler votre séance de <strong>{appointment.service_name}</strong> le {format(appointmentDate, "d MMMM à HH:mm", { locale: fr })}.
                                    </AlertDialogDescription>
                                        
                                    {isLateCancellation && (
                                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
                                                <AlertCircle className="h-4 w-4" />
                                                Annulation Tardive
                                            </div>
                                            <p className="text-sm text-amber-700 mb-3">
                                                Ce rendez-vous est dans moins de 24h ({Math.floor(hoursUntilAppointment)}h). Une pénalité sera appliquée.
                                            </p>
                                            <div className="bg-white/50 rounded p-2 flex justify-between items-center text-sm">
                                                <span className="text-amber-800">Remboursement estimé:</span>
                                                <span className="font-bold text-amber-900">{refundAmount} min <span className="text-xs font-normal opacity-70">/ {appointment.duration}</span></span>
                                            </div>
                                        </div>
                                    )}
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Retour</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={onCancel}
                                        className={isLateCancellation ? "bg-amber-600 hover:bg-amber-700" : "bg-destructive hover:bg-destructive/90"}
                                    >
                                        Confirmer l'annulation
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
        </Card>
    </motion.div>
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

    // Mobile View (Cards)
    const MobileView = () => (
        <div className="space-y-4 md:hidden">
            {paidAppointments.length > 0 ? (
                paidAppointments.map(app => (
                    <Card key={app.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-semibold">{app.service_name}</h4>
                                <p className="text-xs text-muted-foreground">{app.duration} min</p>
                            </div>
                            <Badge variant="outline" className="bg-slate-50">
                                {app.price !== undefined ? `€${app.price.toFixed(2)}` : 'N/A'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 pt-2 border-t">
                             <Calendar className="h-3 w-3" />
                             {format(new Date(app.date), 'd MMMM yyyy', { locale: fr })}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                            <CreditCard className="h-3 w-3" /> 
                            Payé par {app.payment_method === 'card' ? 'Carte' : 'Réception'}
                        </div>
                    </Card>
                ))
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    Aucun paiement trouvé.
                </div>
            )}
        </div>
    );

    return (
        <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
            <CardHeader className="px-0 sm:px-6">
                <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Historique des Paiements
                </CardTitle>
                <CardDescription>
                    Services payés individuellement (hors abonnements).
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
                <MobileView />
                <div className="hidden md:block rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
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
                                        <TableCell className="font-medium">
                                            {app.service_name}
                                            <span className="ml-2 text-xs text-muted-foreground">({app.duration} min)</span>
                                        </TableCell>
                                        <TableCell className="capitalize text-muted-foreground">
                                            {app.payment_method === 'card' ? 'Carte Bancaire' : 'À la réception'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {app.price !== undefined ? `€${app.price.toFixed(2)}` : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Aucun historique de paiement disponible.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
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
          (payload: RealtimePostgresChangesPayload<Appointment>) => {
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
      (event: AuthChangeEvent, session: Session | null) => {
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
    router.push('/reserver');
    sessionStorage.setItem('rescheduleAppointment', JSON.stringify(appointment));
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!user) return;
    try {
        // Obter detalhes do agendamento antes de cancelar (ou do estado local) para o email
        const appToCancel = appointments.find(a => a.id === appointmentId);
        
        // --- LOGIC DE REEMBOLSO DE MINUTOS ---
        if (appToCancel && appToCancel.payment_method === 'minutes') {
             const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('minutes_balance')
                .eq('id', user.id)
                .single();
            
             if (!profileError && profile) {
                 const currentBalance = profile.minutes_balance || 0;
                 
                 // Recalcular a lógica de penalidade no servidor/handler para segurança
                 const appDate = new Date(appToCancel.date);
                 const now = new Date();
                 const minutesUntil = (appDate.getTime() - now.getTime()) / (1000 * 60); // min
                 const hoursUntil = minutesUntil / 60;

                 let refundAmount = appToCancel.duration;
                 let message = `${appToCancel.duration} minutes ont été recréditées sur votre compte.`;

                 if (hoursUntil < 24) {
                     const refundRatio = Math.max(0, hoursUntil / 24);
                     refundAmount = Math.floor(appToCancel.duration * refundRatio);
                     message = `Annulation tardive: ${refundAmount} minutes remboursées sur ${appToCancel.duration}.`;
                 }

                 const newBalance = currentBalance + refundAmount;
                 
                 const { error: refundError } = await supabase
                    .from('profiles')
                    .update({ minutes_balance: newBalance })
                    .eq('id', user.id);
                 
                 if (refundError) {
                     console.error("Erro ao reembolsar minutos:", refundError);
                     throw new Error("Erro ao processar reembolso de minutos.");
                 }
                 
                 toast({
                    title: "Minutes remboursés",
                    description: message,
                 });
             }
        }
        // -------------------------------------

        const { error } = await supabase.from('appointments').update({ status: 'Cancelado' }).eq('id', appointmentId);
        if (error) throw error;

        // --- EMAIL NOTIFICATION (CANCELLATION) ---
        if (appToCancel) {
             console.log("Tentando enviar e-mail de cancelamento...");
             const emailPayload = {
                    type: 'cancellation',
                    to: appToCancel.user_email,
                    data: {
                        userName: appToCancel.user_name,
                        serviceName: appToCancel.service_name,
                        date: appToCancel.date,
                    }
             };
             console.log("Payload Cancelamento:", emailPayload);

             try {
                const emailRes = await fetch('/api/emails/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emailPayload)
                });
                
                if (!emailRes.ok) {
                    const errorText = await emailRes.text();
                    console.error("Falha no envio de e-mail de cancelamento:", emailRes.status, errorText);
                } else {
                    console.log("E-mail de cancelamento enviado com sucesso.");
                }
             } catch (emailErr) {
                 console.error("Erro no fetch de e-mail de cancelamento:", emailErr);
             }
        } else {
            console.warn("Não foi possível encontrar dados do agendamento para enviar e-mail de cancelamento.");
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                    <Card key={i} className="p-6 space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        <div className="pt-4 flex gap-2">
                             <Skeleton className="h-10 w-full" />
                             <Skeleton className="h-10 w-full" />
                        </div>
                    </Card>
                ))}
            </div>
        )
    }

    if(apps.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed"
            >
                <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
                    {type === 'future' ? <Calendar className="h-8 w-8 text-muted-foreground" /> : <Clock className="h-8 w-8 text-muted-foreground" />}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                    {type === 'future' ? 'Aucun rendez-vous prévu' : 'Aucun historique'}
                </h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                    {type === 'future' 
                        ? 'Vous n\'avez pas encore de séance programmée. Prenez soin de vous dès maintenant.' 
                        : 'Vos rendez-vous passés apparaîtront ici une fois terminés.'}
                </p>
                {type === 'future' && (
                    <Button onClick={() => router.push('/reserver')} size="lg" className="shadow-lg shadow-primary/20">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Nouveau Rendez-vous
                    </Button>
                )}
            </motion.div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
                {apps.map(app => (
                    <AppointmentCard 
                        key={app.id} 
                        appointment={app} 
                        onCancel={() => handleCancelAppointment(app.id)}
                        onReschedule={() => handleOpenReschedule(app)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
  }

  if (isLoading || !user) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                <p className="text-muted-foreground animate-pulse">Chargement...</p>
             </div>
        </div>
    );
  }
  
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-background pb-12">
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 border-b py-8 mb-8">
            <div className="container mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                     <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 shrink-0 bg-background hover:bg-background/80">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Mes Rendez-vous</h1>
                        <p className="text-sm text-muted-foreground">Gérez vos séances et consultez votre historique.</p>
                    </div>
                </div>
                 <Button onClick={() => router.push('/reserver')} size="lg" className="w-full sm:w-auto shadow-md">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Réserver
                 </Button>
            </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4">
          <Tabs defaultValue="future" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8 h-12 p-1 bg-slate-100 dark:bg-slate-800 rounded-full">
              <TabsTrigger value="future" className="rounded-full data-[state=active]:shadow-sm">À venir</TabsTrigger>
              <TabsTrigger value="past" className="rounded-full data-[state=active]:shadow-sm">Historique</TabsTrigger>
              <TabsTrigger value="payments" className="rounded-full data-[state=active]:shadow-sm">Paiements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="future" className="mt-0 focus-visible:ring-0">
                {renderAppointments(futureAppointments, 'future')}
            </TabsContent>
            
            <TabsContent value="past" className="mt-0 focus-visible:ring-0">
                {renderAppointments(pastAppointments, 'past')}
            </TabsContent>
            
            <TabsContent value="payments" className="mt-0 focus-visible:ring-0">
                <PaymentHistoryTable appointments={appointments} services={services} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}