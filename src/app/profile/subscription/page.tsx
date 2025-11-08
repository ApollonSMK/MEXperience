
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
    id: string;
    plan_id?: string;
    minutes_balance?: number;
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
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (userId: string) => {
    if (!supabase) {
        console.error("Supabase client not available");
        return;
    }

    try {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, plan_id, minutes_balance')
            .eq('id', userId)
            .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
            throw new Error('Impossible de charger le profil utilisateur.');
        }
        setUserData(profileData as UserProfile | null);
        
        const { data: plansData, error: plansError } = await supabase.from('plans').select('*').order('order');

        if (plansError) {
            console.error('Error fetching plans:', plansError);
        } else {
            setPlans(plansData as Plan[] || []);
        }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erreur de chargement",
            description: error.message || "Une erreur inattendue est survenue lors du chargement de vos données."
        });
        console.error('Error fetching subscription data:', error);
    }
  }, [supabase, toast]);


  useEffect(() => {
    const initializePage = async () => {
        setIsLoading(true);
        const supabaseClient = getSupabaseBrowserClient();
        if (!supabaseClient) {
            router.push('/login');
            return;
        }

        const { data: { session } } = await supabaseClient.auth.getSession();
        const currentUser = session?.user;
        setUser(currentUser);

        if (currentUser) {
            await fetchData(currentUser.id);
        } else {
            router.push('/login');
        }
        setIsLoading(false);
    };

    initializePage();

    const supabaseClient = getSupabaseBrowserClient();
    if (supabaseClient) {
        const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user || null;
            setUser(currentUser);
            if (event === 'SIGNED_OUT') {
              router.push('/login');
            } else if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
              fetchData(currentUser.id);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }
  }, [router, fetchData]);


  const userPlan = useMemo(() => {
    if (!userData || !userData.plan_id || !plans) return null;
    return plans.find(p => p.id === userData.plan_id);
  }, [userData, plans]);
  
  const totalMinutes = userPlan?.minutes || 0;
  const remainingMinutes = userData?.minutes_balance || 0;
  const usedMinutes = totalMinutes > 0 ? Math.max(0, totalMinutes - remainingMinutes) : 0;
  const progressPercentage = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;


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

          <div className="grid lg:grid-cols-1 gap-8 items-start">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{userPlan ? 'Plan Actuel' : 'Aucun Plan'}</CardTitle>
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
                </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
