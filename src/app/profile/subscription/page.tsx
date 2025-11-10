
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UserProfile {
    id: string;
    plan_id?: string;
    minutes_balance?: number;
    stripe_subscription_status?: string;
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

export default function SubscriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchPageData = useCallback(async (userId: string) => {
    if (!supabase) return;
    
    // Don't set loading to true here to allow for background refresh
    const profilePromise = supabase.from('profiles').select('id, plan_id, minutes_balance, stripe_subscription_status, stripe_cancel_at_period_end, stripe_subscription_cancel_at').eq('id', userId).single();
    const plansPromise = supabase.from('plans').select('*').order('order');
    const invoicesPromise = supabase.from('invoices').select('*').eq('user_id', userId).order('date', { ascending: false });

    try {
        const [
            { data: profileData, error: profileError },
            { data: plansData, error: plansError },
            { data: invoicesData, error: invoicesError },
        ] = await Promise.all([profilePromise, plansPromise, invoicesPromise]);
        
        if (profileError && profileError.code !== 'PGRST116') throw new Error(`Impossible de charger le profil: ${profileError.message}`);
        setUserData(profileData as UserProfile | null);
        
        if (plansError) throw new Error(`Impossible de charger les plans: ${plansError.message}`);
        setPlans(plansData as Plan[] || []);

        if (invoicesError) throw new Error(`Impossible de charger les factures: ${invoicesError.message}`);
        setInvoices(invoicesData as Invoice[] || []);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Erreur de chargement", description: error.message });
    }
  }, [supabase, toast]);


  useEffect(() => {
    const initializePage = async () => {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;

        if (currentUser) {
            setUser(currentUser);
            await fetchPageData(currentUser.id);
        } else {
            router.push('/login');
        }
        setIsLoading(false);
    };

    initializePage();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (event === "SIGNED_IN" && session?.user) {
            setUser(session.user);
            fetchPageData(session.user.id);
        }
      }
    );

    const changesChannel = supabase
      .channel('profile-subscription-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user?.id}` }, (payload) => fetchPageData(user!.id))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invoices', filter: `user_id=eq.${user?.id}` }, (payload) => {
         setInvoices(currentInvoices => [payload.new as Invoice, ...currentInvoices]);
      })
      .subscribe();


    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(changesChannel);
    };
  }, [router, supabase, user?.id, fetchPageData]);


  const userPlan = useMemo(() => {
    if (!userData || !userData.plan_id || !plans) return null;
    return plans.find(p => p.id === userData.plan_id);
  }, [userData, plans]);
  
  const remainingMinutes = userData?.minutes_balance || 0;
  const totalMinutes = userPlan?.minutes || 0;
  const usedMinutes = totalMinutes > 0 ? Math.max(0, totalMinutes - remainingMinutes) : 0;
  const progressPercentage = totalMinutes > 0 ? (remainingMinutes / totalMinutes) * 100 : 0;


  const handleChangePlan = () => {
    router.push('/abonnements');
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelNow: false }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Une erreur est survenue.');
      }
      
      toast({
        title: 'Annulation programmée',
        description: 'Votre abonnement sera annulé à la fin de la période de facturation en cours.',
      });
      if (user) {
        await fetchPageData(user.id); // Refresh data to show updated status
      }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Erreur d'annulation",
        description: error.message,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const isSubscriptionActive = userPlan && userData?.stripe_subscription_status === 'active' && !userData.stripe_cancel_at_period_end;
  const isSubscriptionCancelling = userPlan && userData?.stripe_cancel_at_period_end === true;

  if (isLoading || !user) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto max-w-5xl px-4 py-8">
                 <Skeleton className="h-8 w-48 mb-8" />
                 <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="space-y-8">
                        <Skeleton className="h-48 w-full" />
                    </div>
                 </div>
            </main>
            <Footer />
        </div>
    )
  }

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-background">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="flex items-center mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.push('/profile')} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Mon Abonnement</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                {userPlan ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan Actuel</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div>
                                <p className="text-2xl font-bold">{userPlan.title}</p>
                                <p className="text-muted-foreground">{userPlan.price}{userPlan.period}</p>
                            </div>
                            {isSubscriptionCancelling && userData.stripe_subscription_cancel_at && (
                                <Badge variant="destructive" className="w-fit mt-4">
                                Annulé. Expire le {format(new Date(userData.stripe_subscription_cancel_at), 'd MMMM yyyy', { locale: fr })}
                                </Badge>
                            )}
                        </CardContent>
                        <CardFooter className="flex-col sm:flex-row gap-2">
                             <Button onClick={handleChangePlan} variant="outline">
                                Changer de Plan
                            </Button>
                            {isSubscriptionActive && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={isCancelling}>
                                            {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Annuler l'Abonnement
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Êtes-vous sûr de vouloir annuler ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            Votre abonnement restera actif jusqu'à la fin de votre période de facturation en cours. Cette action ne peut pas être annulée.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Rester abonné</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleCancelSubscription} className="bg-destructive hover:bg-destructive/90">
                                            Confirmer l'annulation
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </CardFooter>
                    </Card>
                ) : (
                    <Card>
                         <CardHeader>
                            <CardTitle>Aucun Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-muted-foreground">Vous n'avez pas d'abonnement actif.</p>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleChangePlan}>Voir les Plans</Button>
                        </CardFooter>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Historique de Facturation</CardTitle>
                        <CardDescription>Consultez vos factures passées.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Montant</TableHead>
                                    <TableHead>État</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length > 0 ? invoices.map(invoice => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">{invoice.plan_title || 'Abonnement'}</TableCell>
                                        <TableCell>{format(new Date(invoice.date), 'd MMM, yyyy', { locale: fr })}</TableCell>
                                        <TableCell>€{invoice.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'} className={invoice.status === 'paid' ? 'bg-green-600' : ''}>
                                                {invoice.status === 'paid' ? 'Payé' : 'En attente'}
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
                                        <TableCell colSpan={5} className="text-center h-24">Aucune facture trouvée.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
                 {userPlan && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Utilisation des Minutes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Progress value={progressPercentage} className="h-2" />
                            <div className="flex justify-between text-sm font-medium">
                                <span>{remainingMinutes} min restants</span>
                            </div>
                             <p className="text-xs text-muted-foreground">
                                Sur {totalMinutes} min inclus dans votre plan. 
                                Vos minutes sont renouvelées au début de chaque cycle de facturation.
                            </p>
                        </CardContent>
                    </Card>
                 )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
