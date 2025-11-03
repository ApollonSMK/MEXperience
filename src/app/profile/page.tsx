'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ArrowLeft, ArrowRight, BarChart, CalendarDays, CreditCard, LogOut, User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProfileDetailsForm } from '@/components/profile-details-form';
import { Progress } from '@/components/ui/progress';
import { collection, doc, orderBy, query, Timestamp, where, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc<any>(userDocRef);

  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'plans'), orderBy('order'));
  }, [firestore]);

  const { data: plans, isLoading: arePlansLoading } = useCollection<any>(plansQuery);
  
  // Optimized query for the next appointment
  const nextAppointmentQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'appointments'), 
      where('userId', '==', user.uid),
      where('status', '==', 'Confirmado'),
      where('date', '>=', new Date()),
      orderBy('date', 'asc'),
      limit(1)
    );
  }, [firestore, user]);

  const { data: nextAppointmentData, isLoading: areAppointmentsLoading } = useCollection<any>(nextAppointmentQuery);
  const nextAppointment = useMemo(() => nextAppointmentData?.[0], [nextAppointmentData]);


  const userPlan = useMemo(() => {
    if (!userData || !userData.planId || !plans) return null;
    return plans.find(p => p.id === userData.planId);
  }, [userData, plans]);
  

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const getInitials = (email?: string | null) => {
    return email ? email.substring(0, 2).toUpperCase() : "U";
  };
  
  const isLoading = isUserLoading || isUserDocLoading || arePlansLoading || areAppointmentsLoading;

  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }
  
  const isSubscribed = !!userPlan;
  const currentPlan = userPlan?.title || "Aucun abonnement";
  const totalMinutes = userPlan?.minutes || 0;
  const remainingMinutes = userData?.minutesBalance || 0;
  const usedMinutes = totalMinutes > 0 ? Math.max(0, totalMinutes - remainingMinutes) : 0;
  const progressPercentage = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;


  const dashboardItems = [
    {
      icon: <CalendarDays className="h-8 w-8 text-muted-foreground" />,
      title: "Mes Rendez-vous",
      description: "Consultez et gérez vos séances futures et passées.",
      link: "/profile/appointments",
      status: nextAppointment ? `Prochain: ${format(nextAppointment.date.toDate(), 'dd/MM, HH:mm', {locale: fr})}` : "Aucun RDV futur",
      isModal: false,
    },
    {
      icon: <BarChart className="h-8 w-8 text-muted-foreground" />,
      title: "Statistiques",
      description: "Analysez votre utilisation et vos progrès au fil du temps.",
      link: "#",
      status: "Bientôt disponible",
      isModal: false,
    },
    {
      icon: <CreditCard className="h-8 w-8 text-muted-foreground" />,
      title: "Abonnement",
      description: "Gérez votre plan, vos moyens de paiement et vos factures.",
      link: "/profile/subscription",
      status: currentPlan,
      isModal: false,
    },
    {
      icon: <UserIcon className="h-8 w-8 text-muted-foreground" />,
      title: "Mon Profil",
      description: "Consultez et modifiez vos données personnelles et d'accès.",
      link: "/profile/details",
      isModal: true,
      status: "Gérer les données"
    },
  ];

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-background">
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
            <h1 className="text-2xl sm:text-3xl font-bold">{userData?.displayName || 'Utilisateur'}</h1>
          </div>

          <Card className="mb-8">
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.photoURL || ''} alt={userData?.displayName || 'User'} />
                  <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-lg">{userData?.displayName}</h2>
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
          
          <Dialog>
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
             <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Mon Profil</DialogTitle>
                  <DialogDescription>
                    Consultez et modifiez vos données personnelles et d'accès.
                  </DialogDescription>
                </DialogHeader>
                <ProfileDetailsForm />
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </>
  );
}

    