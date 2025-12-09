'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, CreditCard, Clock, CheckCircle, AlertTriangle, Calendar, Download, FileText, History, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { User, RealtimePostgresChangesPayload, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfile {
    id: string;
    plan_id?: string;
    minutes_balance?: number;
    stripe_subscription_status?: string;
    stripe_subscription_id?: string;
    stripe_cancel_at_period_end?: boolean;
    stripe_subscription_cancel_at?: string;
}
interface Plan {
    id: string;
    title: string;
    price: string;
    period: string;
    minutes: number;
}
interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: string;
    plan_title?: string;
    user_id: string;
}

interface Appointment {
    id: string;
    date: string;
    service_name: string;
    duration: number;
    status: string;
    payment_method: string;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPageData = useCallback(async (userId: string) => {
    if (!supabase) return;
    
    const profilePromise = supabase.from('profiles').select('id, plan_id, minutes_balance, stripe_subscription_status, stripe_subscription_id, stripe_cancel_at_period_end, stripe_subscription_cancel_at').eq('id', userId).single();
    const plansPromise = supabase.from('plans').select('*').order('order');
    const invoicesPromise = supabase.from('invoices').select('*').eq('user_id', userId).order('date', { ascending: false });
    const appointmentsPromise = supabase.from('appointments').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(20);

    try {
        const [
            { data: profileData, error: profileError },
            { data: plansData, error: plansError },
            { data: invoicesData, error: invoicesError },
            { data: appointmentsData, error: appointmentsError },
        ] = await Promise.all([profilePromise, plansPromise, invoicesPromise, appointmentsPromise]);
        
        if (profileError && profileError.code !== 'PGRST116') throw new Error(`Impossible de charger le profil: ${profileError.message}`);
        setUserData(profileData as UserProfile | null);
        
        if (plansError) throw new Error(`Impossible de charger les plans: ${plansError.message}`);
        setPlans(plansData as Plan[] || []);

        if (invoicesError) throw new Error(`Impossible de charger les factures: ${invoicesError.message}`);
        setInvoices(invoicesData as Invoice[] || []);

        if (appointmentsError) console.error("Erreur chargement RDV", appointmentsError);
        setAppointments(appointmentsData as Appointment[] || []);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Erreur de chargement", description: error.message });
    }
  }, [supabase, toast]);


  useEffect(() => {
    let invoiceChannel: any;

    const initializePage = async () => {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;

        if (currentUser) {
            setUser(currentUser);
            await fetchPageData(currentUser.id);

            // Setup realtime subscription for invoices
            invoiceChannel = supabase
                .channel(`invoices-changes-${currentUser.id}`)
                .on(
                    'postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'invoices', filter: `user_id=eq.${currentUser.id}` }, 
                    (payload: RealtimePostgresChangesPayload<Invoice>) => {
                        setInvoices(currentInvoices => [payload.new as Invoice, ...currentInvoices]);
                    }
                )
                .subscribe();

        } else {
            router.push('/login');
        }
        setIsLoading(false);
    };

    initializePage();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (event === "SIGNED_IN") {
            initializePage();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      if (invoiceChannel) supabase.removeChannel(invoiceChannel);
    };
  }, [router, supabase, fetchPageData]);


  const userPlan = useMemo(() => {
    if (!userData || !userData.plan_id || !plans) return null;
    return plans.find(p => p.id === userData.plan_id);
  }, [userData, plans]);
  
  const remainingMinutes = userData?.minutes_balance || 0;
  const totalMinutes = userPlan?.minutes || 0;
  const progressPercentage = totalMinutes > 0 ? (remainingMinutes / totalMinutes) * 100 : 0;


  const handleChangePlan = () => {
    router.push('/abonnements');
  };

  const isSubscriptionActive = userPlan && userData?.stripe_subscription_status === 'active' && !userData.stripe_cancel_at_period_end;
  const isManualPlan = userPlan && !userData?.stripe_subscription_id;
  
  const isSubscriptionCancelling = userPlan && userData?.stripe_cancel_at_period_end === true;

  // Components for Responsive Tables
  const UsageHistory = () => {
    const MobileView = () => (
        <div className="space-y-4 md:hidden">
            {appointments.length > 0 ? appointments.map(appt => (
                <Card key={appt.id} className="p-4 bg-card/50">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                             <h4 className="font-semibold text-sm">{appt.service_name}</h4>
                             {appt.service_name.includes('GUEST') && <Badge variant="secondary" className="mt-1 text-[10px] h-5">Invité</Badge>}
                        </div>
                        <span className="font-bold text-red-500 text-sm">-{appt.duration} min</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(appt.date), 'd MMM, HH:mm', { locale: fr })}
                        </div>
                         <Badge variant={appt.status === 'Annulé' ? 'destructive' : 'outline'} className="text-[10px] h-5 px-1.5">
                            {appt.status}
                        </Badge>
                    </div>
                </Card>
            )) : (
                <div className="text-center py-8 text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune utilisation enregistrée.</p>
                </div>
            )}
        </div>
    );

    const DesktopView = () => (
        <div className="hidden md:block rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead>Date</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Durée</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {appointments.length > 0 ? appointments.map(appt => (
                        <TableRow key={appt.id}>
                            <TableCell>{format(new Date(appt.date), 'd MMM yyyy, HH:mm', { locale: fr })}</TableCell>
                            <TableCell className="font-medium">
                                {appt.service_name}
                                {appt.service_name.includes('GUEST') && <Badge variant="secondary" className="ml-2 text-xs">Invité</Badge>}
                            </TableCell>
                            <TableCell>
                                <Badge variant={appt.status === 'Annulé' ? 'destructive' : 'outline'} className="font-normal">
                                    {appt.status}
                                </Badge>
                            </TableCell>
                             <TableCell className="text-right font-medium text-red-500">-{appt.duration} min</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Aucune utilisation enregistrée.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
            <CardHeader className="px-0 sm:px-6">
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historique d'Utilisation
                </CardTitle>
                <CardDescription>Vos dernières séances et déductions de minutes.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
                <MobileView />
                <DesktopView />
            </CardContent>
        </Card>
    );
  };

  const BillingHistory = () => {
     const MobileView = () => (
        <div className="space-y-4 md:hidden">
            {invoices.length > 0 ? invoices.map(invoice => (
                <Card key={invoice.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                             <h4 className="font-semibold text-sm">{invoice.plan_title || 'Abonnement'}</h4>
                             <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}</p>
                        </div>
                        <Badge variant={invoice.status.toLowerCase() === 'paid' ? 'default' : 'destructive'} className={invoice.status.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : ''}>
                             {invoice.status === 'paid' ? 'Payé' : 'Impayé'}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                        <span className="font-bold">€{invoice.amount.toFixed(2)}</span>
                        <Button onClick={() => router.push('/profile/invoices')} variant="ghost" size="sm" className="h-8 gap-1">
                             <FileText className="h-3.5 w-3.5" />
                             Détails
                        </Button>
                    </div>
                </Card>
            )) : (
                 <div className="text-center py-8 text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune facture trouvée.</p>
                </div>
            )}
        </div>
    );

    const DesktopView = () => (
        <div className="hidden md:block rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead>Date</TableHead>
                        <TableHead>Désignation</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>État</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length > 0 ? invoices.map(invoice => (
                        <TableRow key={invoice.id}>
                            <TableCell>{format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}</TableCell>
                            <TableCell className="font-medium">{invoice.plan_title || 'Abonnement'}</TableCell>
                            <TableCell>€{invoice.amount.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={invoice.status.toLowerCase() === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                                    {invoice.status === 'paid' ? 'Payé' : 'Impayé'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button onClick={() => router.push('/profile/invoices')} variant="ghost" size="sm">
                                   Voir
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Aucune facture trouvée.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
            <CardHeader className="px-0 sm:px-6">
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Historique de Facturation
                </CardTitle>
                <CardDescription>Consultez vos paiements et téléchargez vos factures.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
                <MobileView />
                <DesktopView />
            </CardContent>
        </Card>
    );
  };

  if (isLoading || !user) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                <p className="text-muted-foreground animate-pulse">Chargement de votre abonnement...</p>
             </div>
        </div>
    )
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
                        <h1 className="text-2xl font-bold tracking-tight">Mon Abonnement</h1>
                        <p className="text-sm text-muted-foreground">Gérez votre plan et suivez votre consommation.</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Plan Status & Minutes (Sticky on Desktop) */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                 {userPlan ? (
                    <Card className="overflow-hidden border-t-4 border-t-primary shadow-md">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Plan Actuel</p>
                                    <CardTitle className="text-2xl">{userPlan.title}</CardTitle>
                                </div>
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <Zap className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                             <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-bold">{userPlan.price}</span>
                                <span className="text-muted-foreground">{userPlan.period}</span>
                            </div>

                             <div className="space-y-4 mb-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium flex items-center gap-1.5"><Clock className="h-4 w-4 text-muted-foreground" /> Solde Minutes</span>
                                        <span className={remainingMinutes < 30 ? "text-red-500 font-bold" : "font-bold"}>{remainingMinutes} / {totalMinutes} min</span>
                                    </div>
                                    <Progress value={progressPercentage} className="h-2.5 bg-slate-100" />
                                    <p className="text-xs text-muted-foreground text-right">Renouvellement le 1er du mois</p>
                                </div>
                             </div>

                            <div className="space-y-3">
                                {isSubscriptionCancelling && userData.stripe_subscription_cancel_at && (
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium">Annulation programmée</p>
                                            <p className="text-xs mt-0.5 opacity-90">Expire le {format(new Date(userData.stripe_subscription_cancel_at), 'd MMMM yyyy', { locale: fr })}</p>
                                        </div>
                                    </div>
                                )}
                                {userData?.stripe_subscription_status === 'past_due' && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-700 flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium">Paiement en retard</p>
                                            <p className="text-xs mt-0.5 opacity-90">Veuillez mettre à jour votre moyen de paiement.</p>
                                        </div>
                                    </div>
                                )}
                                {!isSubscriptionCancelling && userData?.stripe_subscription_status === 'active' && (
                                     <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md border border-green-100">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Abonnement actif</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 pt-4">
                             <Button onClick={handleChangePlan} variant="outline" className="w-full">
                                {isManualPlan ? 'Voir les plans' : 'Gérer mon plan'}
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <Card className="border-dashed shadow-sm">
                         <CardHeader>
                            <CardTitle>Aucun Plan Actif</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground">Vous n'avez pas d'abonnement actif pour le moment.</p>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleChangePlan} className="w-full">Voir les abonnements</Button>
                        </CardFooter>
                    </Card>
                )}

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Besoin de plus ?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="secondary" className="w-full justify-start" onClick={() => router.push('/profile/buy-minutes')}>
                            <Clock className="mr-2 h-4 w-4" />
                            Acheter des minutes
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/contact')}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Signaler un problème
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: History Tabs */}
            <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="usage" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <TabsTrigger value="usage" className="rounded-full data-[state=active]:shadow-sm">Historique d'Utilisation</TabsTrigger>
                        <TabsTrigger value="billing" className="rounded-full data-[state=active]:shadow-sm">Facturation</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="usage" className="mt-0 focus-visible:ring-0 space-y-4">
                        <UsageHistory />
                    </TabsContent>
                    
                    <TabsContent value="billing" className="mt-0 focus-visible:ring-0 space-y-4">
                        <BillingHistory />
                    </TabsContent>
                </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}