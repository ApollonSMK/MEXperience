'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { User } from '@supabase/supabase-js';

interface Invoice {
  id: string;
  date: string; // ISO string
  amount: number;
  status: 'Pago' | 'Pendente' | 'Falhou';
  plan_title: string;
  pdf_url?: string;
}

interface UserProfile {
    id: string;
    plan_id?: string;
    minutes_balance?: number;
    stripe_subscription_status?: string;
    stripe_subscription_id?: string;
}
interface Plan {
    id: string;
    title: string;
    price: string;
    period: string;
    minutes: number;
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

  const fetchData = useCallback(async (currentUser: User) => {
    if (!supabase) {
        console.error("Supabase client not available");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
        // Step 1: Fetch profile data. This is critical.
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, plan_id, minutes_balance, stripe_subscription_status, stripe_subscription_id')
            .eq('id', currentUser.id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            throw new Error('Impossible de charger le profil utilisateur.');
        }
        setUserData(profile);

        // Step 2: Fetch plans and invoices in parallel
        const [plansResponse, invoicesResponse] = await Promise.all([
            supabase.from('plans').select('*').order('order'),
            supabase.from('invoices').select('*').eq('user_id', currentUser.id).order('date', { ascending: false })
        ]);

        const { data: plansData, error: plansError } = plansResponse;
        if (plansError) {
            console.warn('Could not fetch plans:', plansError);
            setPlans([]);
        } else {
            setPlans(plansData as Plan[] || []);
        }

        const { data: invoicesData, error: invoicesError } = invoicesResponse;
        if (invoicesError) {
            console.warn('Could not fetch invoices:', invoicesError);
            setInvoices([]);
        } else {
            setInvoices(invoicesData as Invoice[] || []);
        }

    } catch (error: any) {
        toast({ 
            variant: "destructive", 
            title: "Erreur", 
            description: error.message || "Une erreur inattendue est survenue lors du chargement de vos données." 
        });
        console.error('Error fetching subscription data:', error);
    } finally {
        setIsLoading(false);
    }
  }, [supabase, toast]);


  useEffect(() => {
    if (!supabase) return;

    const initializePage = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;
        setUser(currentUser);

        if (currentUser) {
            await fetchData(currentUser);
        } else {
            router.push('/login');
        }
    };

    initializePage();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          fetchData(currentUser);
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [router, fetchData, supabase]);


  const userPlan = useMemo(() => {
    if (!userData || !userData.plan_id || !plans) return null;
    return plans.find(p => p.id === userData.plan_id);
  }, [userData, plans]);
  
  const totalMinutes = userPlan?.minutes || 0;
  const remainingMinutes = userData?.minutes_balance || 0;
  const usedMinutes = totalMinutes > 0 ? Math.max(0, totalMinutes - remainingMinutes) : 0;
  const progressPercentage = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;

  const handleCancelSubscription = async () => {
    if (!user || !supabase || !userData?.stripe_subscription_id) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de trouver les informations de la souscription.' });
        return;
    };
    
    // Server-side cancellation would be better, but for simplicity we do it client-side.
    // In a real app, create an API endpoint that calls Stripe to cancel.
    try {
        const { data: gatewaySettings } = await supabase.from('gateway_settings').select('secret_key').single();
        if (!gatewaySettings?.secret_key) throw new Error("Stripe secret key not found.");

        const response = await fetch('/api/cancel-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptionId: userData.stripe_subscription_id })
        });
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to cancel subscription.');
        }

        toast({
            title: "Annulation en cours...",
            description: "Votre abonnement sera annulé à la fin de la période de facturation.",
        });
        if(user) fetchData(user);
    } catch (e: any) {
        toast({ variant: "destructive", title: "Erreur lors de l'annulation", description: e.message });
    }
  };

  const handleChangePlan = () => {
    router.push('/abonnements');
  };

  if (isLoading || !user) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto max-w-4xl px-4 py-8">
                 <Skeleton className="h-8 w-32 mb-6" />
                 <div className="grid md:grid-cols-2 gap-8">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                 </div>
                 <Skeleton className="h-80 w-full mt-8" />
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

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Historique de Facturation</CardTitle>
                  <CardDescription>Consultez et téléchargez vos factures passées.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            Chargement des factures...
                          </TableCell>
                        </TableRow>
                      ) : invoices && invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.plan_title}</TableCell>
                            <TableCell>{format(new Date(invoice.date), "d MMM, yyyy", { locale: fr })}</TableCell>
                            <TableCell>€{invoice.amount.toFixed(2)}</TableCell>
                            <TableCell>
                               <Badge variant={invoice.status === 'Pago' ? 'default' : invoice.status === 'Pendente' ? 'secondary' : 'destructive'} className={invoice.status === 'Pago' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                  {invoice.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" disabled={!invoice.pdf_url} onClick={() => invoice.pdf_url && window.open(invoice.pdf_url, '_blank')}>
                                  <Download className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))
                      ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                            Aucune facture trouvée.
                            </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1 space-y-6 sticky top-20">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{userPlan ? 'Plan Actuel' : 'Aucun Plan'}</CardTitle>
                             {userData?.stripe_subscription_status && (
                                <Badge variant={userData.stripe_subscription_status === 'active' ? 'default' : 'secondary'} className={userData.stripe_subscription_status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                {userData.stripe_subscription_status}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                    {userPlan ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-2xl font-bold">{userPlan.title}</p>
                                <p className="text-muted-foreground">{userPlan.price}{userPlan.period}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Utilisation des minutes</span>
                                    <span>{remainingMinutes} / {totalMinutes} min</span>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                    Votre solde est renouvelé à chaque cycle de facturation.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Vous n'avez pas d'abonnement actif.</p>
                    )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                    <Button onClick={handleChangePlan} className="w-full">
                        {userPlan ? 'Changer de Plan' : 'Voir les Plans'}
                    </Button>
                    {userPlan && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="w-full text-destructive hover:text-destructive">Annuler l'abonnement</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action annulera votre abonnement à la fin du cycle de facturation en cours.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Non, garder le plan</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCancelSubscription} className="bg-destructive hover:bg-destructive/90">Oui, annuler</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    </CardFooter>
                </Card>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
