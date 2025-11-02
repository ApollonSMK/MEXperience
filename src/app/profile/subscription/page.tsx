'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, orderBy, query, where, Timestamp } from 'firebase/firestore';
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

interface Invoice {
  id: string;
  date: Timestamp;
  amount: number;
  status: 'Pago' | 'Pendente' | 'Falhou';
  planTitle: string;
  pdfUrl?: string;
}


export default function SubscriptionPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: isUserDocLoading, mutate: mutateUser } = useDoc<any>(userDocRef);

  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'plans'), orderBy('order'));
  }, [firestore]);
  const { data: plans, isLoading: arePlansLoading } = useCollection<any>(plansQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'invoices'), where('userId', '==', user.uid), orderBy('date', 'desc'));
  }, [firestore, user]);
  const { data: invoices, isLoading: areInvoicesLoading } = useCollection<Invoice>(invoicesQuery);


  const userPlan = useMemo(() => {
    if (!userData || !userData.planId || !plans) return null;
    return plans.find(p => p.id === userData.planId);
  }, [userData, plans]);
  
  const isLoading = isUserLoading || isUserDocLoading || arePlansLoading || areInvoicesLoading;

  const totalMinutes = userPlan?.minutes || 0;
  const remainingMinutes = userData?.minutesBalance || 0;
  const usedMinutes = totalMinutes > 0 ? totalMinutes - remainingMinutes : 0;
  const progressPercentage = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;

  const handleCancelSubscription = async () => {
    if (!user || !firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    try {
        await setDocumentNonBlocking(userRef, { planId: null }, { merge: true });
        mutateUser();
        toast({
            title: "Subscrição Cancelada",
            description: "A sua subscrição foi cancelada com sucesso.",
        });
    } catch (e: any) {
        toast({ variant: "destructive", title: "Erro ao cancelar", description: e.message });
    }
  };

  const handleChangePlan = () => {
    router.push('/#pricing'); // Scroll to pricing section on homepage
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
      <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-background">
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
                      {areInvoicesLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            A carregar faturas...
                          </TableCell>
                        </TableRow>
                      ) : invoices && invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.planTitle}</TableCell>
                            <TableCell>{format(invoice.date.toDate(), "d 'de' MMMM, yyyy", { locale: fr })}</TableCell>
                            <TableCell>€{invoice.amount.toFixed(2)}</TableCell>
                            <TableCell><Badge variant={invoice.status === 'Pago' ? 'secondary' : 'destructive'}>{invoice.status}</Badge></TableCell>
                            <TableCell>
                                <Button variant="outline" size="sm" disabled={!invoice.pdfUrl} onClick={() => invoice.pdfUrl && window.open(invoice.pdfUrl, '_blank')}>
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

    