'use client';

import { useEffect, useMemo } from 'react';
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
import { collection, doc, orderBy, query } from 'firebase/firestore';


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
  
  const isLoading = isUserLoading || isUserDocLoading || arePlansLoading;

  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }
  
  const isSubscribed = !!userPlan;
  const currentPlan = userPlan?.title || "Nenhuma subscrição";
  const totalMinutes = userPlan?.minutes || 0;
  const usedMinutes = 0; // Mock data, replace with real data
  const remainingMinutes = totalMinutes - usedMinutes;
  const progressPercentage = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;


  const dashboardItems = [
    {
      icon: <CalendarDays className="h-8 w-8 text-muted-foreground" />,
      title: "Meus Agendamentos",
      description: "Veja e gira as suas sessões futuras e passadas.",
      link: "#",
      status: "A carregar...",
      isModal: false,
    },
    {
      icon: <BarChart className="h-8 w-8 text-muted-foreground" />,
      title: "Estatísticas",
      description: "Analise o seu uso e progresso ao longo do tempo.",
      link: "#",
      isModal: false,
    },
    {
      icon: <CreditCard className="h-8 w-8 text-muted-foreground" />,
      title: "Subscrição",
      description: "Gira o seu plano, métodos de pagamento e faturas.",
      link: "#",
      status: "A carregar...",
      isModal: false,
    },
    {
      icon: <UserIcon className="h-8 w-8 text-muted-foreground" />,
      title: "Meu Perfil",
      description: "Consulte e edite os seus dados pessoais e de acesso.",
      link: "/profile/details",
      isModal: true,
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
              Voltar
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

          <div className="mb-8">
            <p className="text-muted-foreground">Bem-vindo(a) de volta,</p>
            <h1 className="text-3xl font-bold">{userData?.displayName || 'Utilizador'}</h1>
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
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="text-right w-full md:w-1/2">
                {isSubscribed ? (
                  <div className="space-y-2">
                     <p className="text-sm font-semibold">{currentPlan}</p>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">{remainingMinutes} / {totalMinutes} minutos restantes</p>
                  </div>
                ) : (
                   <p className="text-sm text-muted-foreground">Sem subscrição ativa.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Dialog>
            <div className="grid grid-cols-2 gap-6">
              {dashboardItems.map((item) => {
                if (item.isModal) {
                  return (
                    <DialogTrigger asChild key={item.title}>
                      <Card className="h-full hover:bg-card/90 transition-colors cursor-pointer">
                        <CardHeader>
                          {item.icon}
                          <CardTitle className="mt-2">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>{item.description}</CardDescription>
                          <div className="flex justify-between items-center mt-4">
                            <p className="text-xs text-muted-foreground">{item.status}</p>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                  );
                }
                return (
                  <a href={item.link} key={item.title}>
                    <Card className="h-full hover:bg-card/90 transition-colors">
                      <CardHeader>
                        {item.icon}
                        <CardTitle className="mt-2">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{item.description}</CardDescription>
                        <div className="flex justify-between items-center mt-4">
                          <p className="text-xs text-muted-foreground">{item.status}</p>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
             <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Meu Perfil</DialogTitle>
                  <DialogDescription>
                    Consulte e edite os seus dados pessoais e de acesso.
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
