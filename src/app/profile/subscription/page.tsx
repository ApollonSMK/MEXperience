'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, orderBy, query } from 'firebase/firestore';
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

// Mock data for invoices
const invoices = [
  { id: 'INV-001', date: '1 de Julho, 2024', amount: '€79.00', status: 'Pago' },
  { id: 'INV-002', date: '1 de Junho, 2024', amount: '€79.00', status: 'Pago' },
  { id: 'INV-003', date: '1 de Maio, 2024', amount: '€79.00', status: 'Pago' },
];

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

  const userPlan = useMemo(() => {
    if (!userData || !userData.planId || !plans) return null;
    return plans.find(p => p.id === userData.planId);
  }, [userData, plans]);
  
  const isLoading = isUserLoading || isUserDocLoading || arePlansLoading;

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
                        <TableHead>Fatura</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead><span className="sr-only">Ações</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.id}</TableCell>
                          <TableCell>{invoice.date}</TableCell>
                          <TableCell>{invoice.amount}</TableCell>
                          <TableCell><Badge variant="secondary">{invoice.status}</Badge></TableCell>
                          <TableCell><Button variant="outline" size="sm">Download</Button></TableCell>
                        </TableRow>
                      ))}
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
