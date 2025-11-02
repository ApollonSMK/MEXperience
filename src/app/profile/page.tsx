'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ArrowLeft, ArrowRight, BarChart, CalendarDays, CreditCard, LogOut, User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProfileDetailsForm } from '@/components/profile-details-form';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const getInitials = (email?: string | null) => {
    return email ? email.substring(0, 2).toUpperCase() : "U";
  };

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

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
            <h1 className="text-3xl font-bold">{user.displayName || 'Utilizador'}</h1>
          </div>

          <Card className="mb-8">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-lg">{user.displayName}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Sem subscrição ativa.</p>
              </div>
            </CardContent>
          </Card>
          
          <Dialog>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
