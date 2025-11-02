'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone, Calendar as CalendarIcon, Star, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UserEditForm, type UserFormValues } from '@/components/user-edit-form';
import { setDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Interfaces
interface UserData {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  dob?: Timestamp;
  planId?: string;
  isAdmin: boolean;
  minutesBalance?: number;
  creationTime?: Timestamp;
}

interface Appointment {
  id: string;
  serviceName: string;
  date: Timestamp;
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
}

interface Plan {
    id: string;
    title: string;
    price: string;
    minutes: number;
}

const getInitials = (name?: string) => {
  return name ? name.split(' ').map((n) => n[0]).join('') : 'U';
};

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newMinutesBalance, setNewMinutesBalance] = useState<number | string>('');


  // User Data
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  const { data: user, isLoading: isUserLoading, mutate: mutateUser } = useDoc<UserData>(userDocRef);

  // Appointments Data
  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, 'appointments'), where('userId', '==', userId));
  }, [firestore, userId]);
  const { data: appointments, isLoading: areAppointmentsLoading } = useCollection<Appointment>(appointmentsQuery);
  
  const sortedAppointments = useMemo(() => {
    if (!appointments) return [];
    return [...appointments].sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
  }, [appointments]);


  // Plans Data
  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'plans'), orderBy('order'));
  }, [firestore]);
  const { data: plans, isLoading: arePlansLoading } = useCollection<Plan>(plansQuery);

  const userPlan = useMemo(() => {
    if (!user || !user.planId || !plans) return null;
    return plans.find(p => p.id === user.planId);
  }, [user, plans]);

  const isLoading = isUserLoading || areAppointmentsLoading || arePlansLoading;

  const handleFormSubmit = async (values: UserFormValues) => {
    if (!firestore || !userId) return;

    const userRef = doc(firestore, 'users', userId);

    try {
      await setDocumentNonBlocking(userRef, {
        ...values,
        displayName: `${values.firstName} ${values.lastName}`,
      }, { merge: true });
      
      toast({ title: "Utilizador Atualizado!", description: "Os dados do utilizador foram guardados." });
      setIsEditDialogOpen(false);
      mutateUser();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    }
  };
  
   const handlePlanChange = async (newPlanId: string) => {
    if (!firestore || !userId) return;

    const userRef = doc(firestore, 'users', userId);
     try {
      await setDocumentNonBlocking(userRef, { planId: newPlanId === 'none' ? null : newPlanId }, { merge: true });
      toast({ title: "Plano Atualizado!", description: "O plano do utilizador foi alterado com sucesso." });
      mutateUser();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao alterar plano", description: e.message });
    }
  };
  
  const handleUpdateMinutes = async () => {
    if (!firestore || !userId || newMinutesBalance === '' || isNaN(Number(newMinutesBalance))) {
        toast({ variant: "destructive", title: "Valor Inválido", description: "Por favor, insira um número válido para os minutos." });
        return;
    }

    const userRef = doc(firestore, 'users', userId);
    try {
      await setDocumentNonBlocking(userRef, { minutesBalance: Number(newMinutesBalance) }, { merge: true });
      toast({ title: "Saldo Atualizado!", description: "O saldo de minutos do utilizador foi atualizado." });
      setNewMinutesBalance('');
      mutateUser();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao atualizar saldo", description: e.message });
    }
  };

  const handleDeleteUser = async () => {
    if (!firestore || !userId) return;
    try {
      const userRef = doc(firestore, 'users', userId);
      await deleteDocumentNonBlocking(userRef);
      toast({
        title: 'Utilizador Removido!',
        description: 'O utilizador foi removido com sucesso.',
      });
      router.push('/admin/users');
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover utilizador',
        description: e.message || 'Ocorreu um erro inesperado.',
      });
    }
    setIsDeleteDialogOpen(false);
  };
  
  const userType = useMemo(() => {
    if (!user) return null;
    if (user.isAdmin) return { text: 'Administrador', variant: 'default' as const };
    if (user.creationTime) return { text: 'Utilizador', variant: 'secondary' as const };
    return { text: 'Convidado', variant: 'outline' as const };
  }, [user]);


  if (isLoading) {
    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6">
            <Skeleton className="h-10 w-24" />
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <Skeleton className="lg:col-span-1 h-64" />
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold">Utilizador não encontrado</h2>
        <p className="text-muted-foreground">O utilizador que procura não existe ou foi removido.</p>
        <Button onClick={() => router.push('/admin/users')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a lista
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={() => router.push('/admin/users')} className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Utilisateurs
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remover Utilizador
            </Button>
        </div>


        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Coluna Esquerda - Perfil e Subscrição */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <Avatar className="h-20 w-20 border-2 border-primary">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar Perfil</span>
                    </Button>
                </div>
                <CardTitle className="text-2xl pt-4">{user.displayName}</CardTitle>
                {userType && <Badge variant={userType.variant}>{userType.text}</Badge>}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                </div>
                 <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{user.dob ? format(user.dob.toDate(), 'd MMMM, yyyy', { locale: ptBR }) : 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Subscrição</CardTitle>
                    <CardDescription>Gira o plano de subscrição do utilizador.</CardDescription>
                </CardHeader>
                <CardContent>
                    {arePlansLoading ? <Skeleton className="h-10 w-full" /> : (
                        <Select onValueChange={handlePlanChange} value={userPlan?.id || 'none'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecionar um plano..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhum Plano</SelectItem>
                                {plans?.map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.title} ({plan.price})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                     <div className="mt-4 text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Minutos do Plano</p>
                        <p className="text-3xl font-bold">{userPlan?.minutes || 0}</p>
                     </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Saldo de Minutos</CardTitle>
                    <CardDescription>Veja e ajuste o saldo de minutos do utilizador.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-5xl font-bold">{user.minutesBalance ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Minutos disponíveis</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <div className="flex w-full items-center gap-2">
                         <Input
                            type="number"
                            placeholder="Novo saldo de minutos"
                            value={newMinutesBalance}
                            onChange={(e) => setNewMinutesBalance(e.target.value)}
                         />
                         <Button onClick={handleUpdateMinutes}>Atualizar</Button>
                    </div>
                     <p className="text-xs text-muted-foreground">Insira o novo valor total de minutos para o utilizador.</p>
                </CardFooter>
            </Card>

          </div>

          {/* Coluna Direita - Agendamentos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Agendamentos</CardTitle>
                <CardDescription>Uma lista de todos os agendamentos passados e futuros do utilizador.</CardDescription>
              </CardHeader>
              <CardContent>
                {areAppointmentsLoading ? <Skeleton className="h-48 w-full" /> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Serviço</TableHead>
                            <TableHead>Data e Hora</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedAppointments && sortedAppointments.length > 0 ? (
                            sortedAppointments.map((app) => (
                                <TableRow key={app.id}>
                                <TableCell className="font-medium">{app.serviceName}</TableCell>
                                <TableCell>{format(app.date.toDate(), "d MMM yyyy, HH:mm", { locale: ptBR })}</TableCell>
                                <TableCell>{app.duration} min</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            app.status === 'Confirmado' ? 'default'
                                            : app.status === 'Concluído' ? 'secondary'
                                            : 'destructive'
                                        }
                                        className="capitalize"
                                    >
                                    {app.status}
                                    </Badge>
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                Nenhum agendamento encontrado.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Editar Utilizador</DialogTitle>
              <DialogDescription>
                Modifique os dados e permissões do utilizador.
              </DialogDescription>
            </DialogHeader>
            <UserEditForm
              onSubmit={handleFormSubmit}
              initialData={user}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isto irá remover permanentemente o utilizador <span className="font-bold">{user.displayName}</span> do sistema.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
                Remover
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
