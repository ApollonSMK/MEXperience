'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CreditCard, LogOut, User as UserIcon, FileText, Calendar, Ticket, Clock, Gift } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import Link from 'next/link';

interface UserProfile {
    id: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    photo_url?: string;
    plan_id?: string;
    minutes_balance?: number;
    phone?: string;
    dob?: string;
    stripe_subscription_status?: string;
}

interface Plan {
    id: string;
    title: string;
    minutes: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (currentUser: User) => {
    if (!supabase) return;
    
    setIsLoading(true);
    
    const profilePromise = supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    const plansPromise = supabase.from('plans').select('*').order('order');

    const [
        { data: profile, error: profileError },
        { data: plansData, error: plansError },
    ] = await Promise.all([profilePromise, plansPromise]);

    if (profileError) {
        if (profileError.code === 'PGRST116') {
            const meta = currentUser.user_metadata || {};
            const fullName = meta.full_name || meta.name || '';
            const parts = fullName.split(' ');
            
            toast({ title: "Bienvenue !", description: "Veuillez compléter votre profil (téléphone) pour continuer." });
        } else {
            console.error('Error fetching profile', profileError);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger votre profil. ' + profileError.message });
        }
    } else {
        setUserData(profile);
    }
    
    if (plansError) console.error('Error fetching plans', plansError);
    else setPlans(plansData || []);

    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    if (!supabase) return;
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
            fetchData(currentUser);
        } else {
            router.push('/login');
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [router, supabase, fetchData]);

  const userPlan = useMemo(() => {
    if (!userData || !userData.plan_id || !plans) return null;
    return plans.find(p => p.id === userData.plan_id);
  }, [userData, plans]);
  
  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/');
  };
  
  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50/50 dark:bg-zinc-900/50 py-10">
        <div className="container mx-auto max-w-5xl px-4 space-y-8">
            
            {/* Top Profile Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
                {/* Decoration */}
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                <div className="flex items-center gap-6 relative z-10">
                    {/* Avatar */}
                    <Avatar className="w-20 h-20 border-4 border-white shadow-xl flex-shrink-0">
                        <AvatarImage src={userData?.photo_url} />
                        <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                            {userData?.first_name?.[0]}{userData?.last_name?.[0]}
                        </AvatarFallback>
                    </Avatar>

                    {/* Conteúdo principal ao lado da foto */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {userData?.display_name || 'Utilisateur'}
                        </h1>
                        <p className="text-gray-500 font-medium">{userData?.email}</p>
                    </div>

                    {/* Minutos no centro */}
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
                            {userData?.minutes_balance || 0} min
                        </span>
                    </div>
                </div>

                {/* Gold plan embaixo da foto */}
                <div className="mt-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-primary">{userPlan?.title || 'Aucun plan actif'}</span>
                </div>

                {/* Barra de progresso - APENAS SE TIVER PLANO */}
                {userData?.plan_id && (
                    <div className="mt-4">
                        <AnimatedProgress 
                            value={userData?.minutes_balance || 0} 
                            max={userPlan?.minutes || 100}
                            className="w-full"
                        />
                    </div>
                )}

                <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors z-20" onClick={handleSignOut}>
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>

            {/* Bento Grid Menu */}
            <div className="rounded-3xl bg-gray-50/50 dark:bg-zinc-900/50 p-6">
                <BentoGrid className="md:auto-rows-[9rem]">
                    {/* Appointments - 1 */}
                    <Link href="/profile/appointments" className="md:col-span-1 row-span-1 group">
                        <BentoGridItem
                            title="Mes Rendez-vous"
                            description="Historique et prochaines séances."
                            icon={<Calendar className="h-4 w-4 text-primary" />}
                            className="h-full cursor-pointer"
                        />
                    </Link>

                    {/* Subscription - 2 */}
                    <Link href="/profile/subscription" className="md:col-span-2 row-span-1 group">
                        <BentoGridItem
                            title="Mon Abonnement"
                            description="Gérez votre plan, votre méthode de paiement et visualisez votre utilisation détaillée."
                            icon={<CreditCard className="h-4 w-4 text-primary" />}
                            className="h-full cursor-pointer"
                        />
                    </Link>

                    {/* Gift Cards - New Item */}
                    <Link href="/profile/gift-cards" className="md:col-span-1 row-span-1 group">
                        <BentoGridItem
                            title="Cartes Cadeaux"
                            description="Vos cartes achetées et reçues."
                            icon={<Gift className="h-4 w-4 text-primary" />}
                            className="h-full cursor-pointer"
                        />
                    </Link>

                    {/* Invites - 3 */}
                    <Link href="/profile/invite" className="md:col-span-1 row-span-1 group">
                        <BentoGridItem
                            title="Passes Invité"
                            description="Générez et partagez des passes d'invités."
                            icon={<Ticket className="h-4 w-4 text-primary" />}
                            className="h-full cursor-pointer"
                        />
                    </Link>

                    {/* Invoices - 4 */}
                    <Link href="/profile/invoices" className="md:col-span-1 row-span-1 group">
                        <BentoGridItem
                            title="Factures"
                            description="Téléchargez vos reçus."
                            icon={<FileText className="h-4 w-4 text-primary" />}
                            className="h-full cursor-pointer"
                        />
                    </Link>

                    {/* Profile Edit - 5 (Full width at bottom) - UPDATED TO LINK */}
                    <Link href="/profile/details" className="md:col-span-3 row-span-1 group cursor-pointer">
                        <BentoGridItem
                            title="Mes Informations"
                            description="Mettez à jour vos coordonnées et mot de passe."
                            icon={<UserIcon className="h-4 w-4 text-primary" />}
                            className="h-full"
                        />
                    </Link>
                </BentoGrid>
            </div>
        </div>
      </main>
      <Footer />
    </>
  );
}