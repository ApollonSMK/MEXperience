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

  const fetchData = useCallback(async (userId: string) => {
    setIsLoading(true);
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, plan_id, minutes_balance')
        .eq('id', userId)
        .single();
    if (profileError) console.error('Error fetching profile', profileError);
    else setUserData(profile);
    
    const { data: plansData, error: plansError } = await supabase.from('plans').select('*').order('order');
    if (plansError) console.error('Error fetching plans', plansError);
    else setPlans(plansData as Plan[] || []);

    const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    if (invoicesError) console.error('Error fetching invoices', invoicesError);
    else setInvoices(invoicesData as Invoice[] || []);

    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
            fetchData(currentUser.id);
        } else {
            router.push('/login');
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [router, fetchData, supabase.auth]);


  const userPlan = useMemo(() => {
    if (!userData || !userData.plan_id || !plans) return null;
    return plans.find(p => p.id === userData.plan_id);
  }, [userData, plans]);
  
  const totalMinutes = userPlan?.minutes || 0;
  const remainingMinutes = userData?.minutes_balance || 0;
  const usedMinutes = totalMinutes > 0 ? Math.max(0, totalMinutes - remainingMinutes) : 0;
  const progressPercentage = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;

  const handleCancelSubscription = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ plan_id: null }).eq('id', user.id);
    if (error) {
        toast({ variant: "destructive", title: "Erro ao cancelar", description: error.message });
    } else {
        fetchData(user.id);
        toast({
            title: "Subscrição Cancelada",
            description: "A sua subscrição foi cancelada com sucesso.",
        });
    }
  };

  const handleChangePlan = () => {
    router.push('/#pricing');
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
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Perfil
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-8">Minha Subscrição</h1>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Coluna Esquerda */}
            <div className="md:col-span-3 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Plano Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  {userPlan ? (
                    <div>
                      <p className="text-2xl font-bold">{userPlan.title}</p>
                      <p className="text-muted-foreground">{userPlan.price}{userPlan.period}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Você não tem uma subscrição ativa.</p>
                  )}
                </CardContent>
                <CardFooter className="gap-2">
                  <Button onClick={handleChangePlan}>
                    {userPlan ? 'Alterar Plano' : 'Ver Planos'}
                  </Button>
                  {userPlan && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Cancelar Subscrição</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação irá cancelar a sua subscrição no final do ciclo de faturação atual.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Não, manter plano</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCancelSubscription}>Sim, cancelar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Faturação</CardTitle>
                  <CardDescription>Consulte as suas faturas passadas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plano</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead><span className="sr-only">Ações</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            A carregar faturas...
                          </TableCell>
                        </TableRow>
                      ) : invoices && invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.plan_title}</TableCell>
                            <TableCell>{format(new Date(invoice.date), "d 'de' MMMM, yyyy", { locale: fr })}</TableCell>
                            <TableCell>€{invoice.amount.toFixed(2)}</TableCell>
                            <TableCell><Badge variant={invoice.status === 'Pago' ? 'secondary' : 'destructive'}>{invoice.status}</Badge></TableCell>
                            <TableCell>
                                <Button variant="outline" size="sm" disabled={!invoice.pdf_url} onClick={() => invoice.pdf_url && window.open(invoice.pdf_url, '_blank')}>
                                Download
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))
                      ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                            Nenhuma fatura encontrada.
                            </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Uso de Minutos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {userPlan ? (
                        <>
                            <Progress value={progressPercentage} className="h-3" />
                            <div className="flex justify-between text-sm">
                                <p><span className="font-bold">{usedMinutes}</span> de {totalMinutes} min usados</p>
                                <p><span className="font-bold">{remainingMinutes}</span> min restantes</p>
                            </div>
                            <p className="text-xs text-muted-foreground pt-2">
                                Os seus minutos são renovados no início de cada ciclo de faturação.
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Subscreva um plano para começar a usar os seus minutos.
                        </p>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
