'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ArrowLeft, ArrowRight, BarChart, CalendarDays, CreditCard, LogOut, User as UserIcon, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProfileDetailsForm } from '@/components/profile-details-form';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

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
}
interface Plan {
    id: string;
    title: string;
    minutes: number;
}
interface Appointment {
    id: string;
    date: string; // ISO string
}
interface Invoice {
    id: string;
    amount: number;
    date: string;
}

const isProfileComplete = (profile: UserProfile | null): boolean => {
    if (!profile) return false;
    return !!(profile.first_name && profile.last_name && profile.phone && profile.dob);
};


export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const fetchData = useCallback(async (currentUser: User) => {
    if (!supabase) return;
    
    setIsLoading(true);
    
    const profilePromise = supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    const plansPromise = supabase.from('plans').select('*').order('order');
    const appointmentPromise = supabase
        .from('appointments')
        .select('id, date')
        .eq('user_id', currentUser.id)
        .eq('status', 'Confirmado')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(1)
        .single();
    const invoicePromise = supabase
        .from('invoices')
        .select('id, amount, date')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

    const [
        { data: profile, error: profileError },
        { data: plansData, error: plansError },
        { data: appointmentData, error: appointmentError },
        { data: invoiceData, error: invoiceError }
    ] = await Promise.all([profilePromise, plansPromise, appointmentPromise, invoicePromise]);

    if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile', profileError);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger votre profil. ' + profileError.message });
    } else {
        setUserData(profile);
        if (profile && !isProfileComplete(profile)) {
            setIsProfileModalOpen(true);
        }
    }
    
    if (plansError) console.error('Error fetching plans', plansError);
    else setPlans(plansData || []);

    if (appointmentError && appointmentError.code !== 'PGRST116') {
      console.error('Error fetching next appointment', appointmentError);
    } else {
      setNextAppointment(appointmentData);
    }
    
    if (invoiceError && invoiceError.code !== 'PGRST116') {
      console.error('Error fetching last invoice', invoiceError);
    } else {
      setLastInvoice(invoiceData);
    }


    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    if (!supabase) return;
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
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

  const getInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name ? name.split(' ').map((n) => n[0]).join('') : "U";
  };
  
  const handleProfileUpdate = () => {
    if (user) {
        fetchData(user); // Re-fetch data after profile update
    }
    setIsProfileModalOpen(false); // Close the modal
  }
  
  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }
  
  const isSubscribed = !!userPlan;
  const currentPlan = userPlan?.title || "Aucun abonnement";
  const totalMinutes = userPlan?.minutes || 0;
  const remainingMinutes = userData?.minutes_balance || 0;
  const usedMinutes = totalMinutes > 0 ? Math.max(0, totalMinutes - remainingMinutes) : 0;
  const progressPercentage = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;


  const dashboardItems = [
    {
      icon: <CalendarDays className="h-8 w-8 text-muted-foreground" />,
      title: "Mes Rendez-vous",
      description: "Consultez et gérez vos séances futures et passées.",
      link: "/profile/appointments",
      status: nextAppointment ? `Prochain: ${format(new Date(nextAppointment.date), 'dd/MM, HH:mm', {locale: fr})}` : "Aucun RDV futur",
      isModal: false,
    },
    {
      icon: <CreditCard className="h-8 w-8 text-muted-foreground" />,
      title: "Abonnement",
      description: "Gérez votre plan et vos moyens de paiement.",
      link: "/profile/subscription",
      status: currentPlan,
      isModal: false,
    },
     {
      icon: <FileText className="h-8 w-8 text-muted-foreground" />,
      title: "Mes Factures",
      description: "Consultez l'historique de vos paiements.",
      link: "/profile/invoices",
      status: lastInvoice ? `Dernière: €${lastInvoice.amount.toFixed(2)}` : "Aucune facture",
      isModal: false,
    },
    {
      icon: <UserIcon className="h-8 w-8 text-muted-foreground" />,
      title: "Mon Profil",
      description: "Consultez et modifiez vos données personnelles.",
      link: "/profile/details",
      isModal: true,
      status: "Gérer les données"
    },
  ];

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>

          <div className="mb-8">
            <p className="text-muted-foreground">Bienvenue,</p>
            <h1 className="text-2xl sm:text-3xl font-bold">{userData?.display_name || user.email}</h1>
          </div>

          {userData && (
            <Card className="mb-8">
              <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.user_metadata?.photo_url || ''} alt={userData?.display_name || 'User'} />
                    <AvatarFallback>{getInitials(userData?.display_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-lg">{userData?.display_name}</h2>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="text-left md:text-right w-full md:w-1/2">
                  {isSubscribed ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">{currentPlan}</p>
                      <Progress value={progressPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">{remainingMinutes} / {totalMinutes} minutes restantes</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun abonnement actif.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {dashboardItems.map((item) => {
                const cardContent = (
                  <Card className="h-full hover:bg-card/90 transition-colors cursor-pointer">
                    <CardHeader>
                      {item.icon}
                      <CardTitle className="mt-2 text-base sm:text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs sm:text-sm">{item.description}</CardDescription>
                      <div className="flex justify-between items-center mt-4">
                        <p className="text-xs text-primary font-semibold">{item.status}</p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );

                if (item.isModal) {
                  return (
                    <DialogTrigger asChild key={item.title}>
                      {cardContent}
                    </DialogTrigger>
                  );
                }
                return (
                  <Link href={item.link} key={item.title} className="block">
                    {cardContent}
                  </Link>
                );
              })}
            </div>
             <DialogContent className="sm:max-w-[625px]" onInteractOutside={(e) => !userData || isProfileComplete(userData) ? undefined : e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>{userData && isProfileComplete(userData) ? 'Mon Profil' : 'Complétez Votre Profil'}</DialogTitle>
                  <DialogDescription>
                     {userData && isProfileComplete(userData) 
                        ? "Consultez et modifiez vos données personnelles et d'accès."
                        : "Pour continuer, veuillez compléter vos informations personnelles. C'est rapide et nécessaire pour utiliser nos services."
                     }
                  </DialogDescription>
                </DialogHeader>
                <ProfileDetailsForm onUpdateSuccess={handleProfileUpdate} />
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </>
  );
}
