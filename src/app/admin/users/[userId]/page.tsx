'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone, Calendar as CalendarIcon, Star, Trash2, Clock, FilePlus2, User, CreditCard, List, Shield, AlertTriangle, UserCheck2, UserX2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { getUserById } from '../actions';


// --- Interfaces ---
interface UserData {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  email: string;
  photo_url?: string;
  phone?: string;
  dob?: string;
  plan_id?: string;
  is_admin: boolean;
  minutes_balance?: number;
  creation_time?: string;
}
interface Appointment { id: string; service_name: string; date: string; duration: number; status: 'Confirmado' | 'Concluído' | 'Cancelado';}
interface Plan { id: string; title: string; price: string; minutes: number; }

// --- Schemas ---
const profileSchema = z.object({
  first_name: z.string().min(1, 'O nome é obrigatório.'),
  last_name: z.string().min(1, 'O apelido é obrigatório.'),
  phone: z.string().min(1, 'O telefone é obrigatório.'),
  dob: z.date({ required_error: 'A data de nascimento é obrigatória.' }),
  minutes_balance: z.coerce.number().int().min(0, 'O saldo de minutos não pode ser negativo.').optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

// --- Helper Components ---
const getInitials = (name?: string) => name ? name.split(' ').map((n) => n[0]).join('') : 'U';

const NavItem = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    )}
  >
    {icon}
    {label}
  </button>
);

const ProfileSection = ({ user, mutateUser }: { user: UserData, mutateUser: () => void }) => {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [dobDay, setDobDay] = useState<string | undefined>();
  const [dobMonth, setDobMonth] = useState<string | undefined>();
  const [dobYear, setDobYear] = useState<string | undefined>();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      minutes_balance: user.minutes_balance ?? 0,
    },
  });

  useEffect(() => {
    if (user) {
        form.reset({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            minutes_balance: user.minutes_balance ?? 0,
        });
        if (user.dob) {
            const dobDate = new Date(user.dob);
            if (!isNaN(dobDate.getTime())) {
                setDobDay(String(dobDate.getUTCDate()));
                setDobMonth(String(dobDate.getUTCMonth() + 1));
                setDobYear(String(dobDate.getUTCFullYear()));
                form.setValue('dob', dobDate);
            }
        }
    }
  }, [user, form]);
  
  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      const day = parseInt(dobDay, 10);
      const month = parseInt(dobMonth, 10) - 1;
      const year = parseInt(dobYear, 10);
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime()) && date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
        form.setValue('dob', date, { shouldValidate: true });
      }
    }
  }, [dobDay, dobMonth, dobYear, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if(!supabase) return;
    try {
      const { error } = await supabase.from('profiles').update({
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: `${data.first_name} ${data.last_name}`,
        phone: data.phone,
        dob: format(data.dob, 'yyyy-MM-dd'),
        minutes_balance: data.minutes_balance,
      }).eq('id', user.id);

      if (error) throw error;
      toast({ title: "Utilizador Atualizado!", description: "Os dados do utilizador foram guardados." });
      mutateUser();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    }
  };
  
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = dobMonth && dobYear ? Array.from({ length: new Date(parseInt(dobYear), parseInt(dobMonth), 0).getDate() }, (_, i) => i + 1) : Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Gira os dados pessoais deste utilizador.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
             <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border">
                    <AvatarImage src={user.photo_url || ''} alt={user.display_name} />
                    <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                </Avatar>
                 <div className="grid grid-cols-2 gap-4 flex-grow">
                    <FormField control={form.control} name="first_name" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl><Input placeholder="Ana" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="last_name" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Apelido</FormLabel>
                          <FormControl><Input placeholder="Silva" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
                 <FormItem>
                    <FormLabel>Email</FormLabel>
                    <Input value={user.email} disabled />
                </FormItem>
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl><Input placeholder="+351 912 345 678" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
             <FormField control={form.control} name="dob" render={() => (
                <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                    <Select onValueChange={setDobDay} value={dobDay}>
                        <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                        <SelectContent>{days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={setDobMonth} value={dobMonth}>
                        <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                        <SelectContent>{months.map(m => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={setDobYear} value={dobYear}>
                        <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                        <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    </div>
                    <FormMessage />
                </FormItem>
             )} />
             <Separator />
             <FormField control={form.control} name="minutes_balance" render={({ field }) => (
                <FormItem>
                    <FormLabel>Saldo de Minutos</FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
          </CardContent>
          <CardFooter className="border-t px-6 py-4 justify-end">
             <Button type="submit" disabled={form.formState.isSubmitting}>Salvar Alterações</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

const SubscriptionSection = ({ user, plans, mutateUser }: { user: UserData, plans: Plan[] | null, mutateUser: () => void }) => {
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();

    const userPlan = useMemo(() => {
        if (!user || !user.plan_id || !plans) return null;
        return plans.find(p => p.id === user.plan_id);
    }, [user, plans]);

    const handlePlanChange = async (newPlanId: string) => {
        if(!supabase) return;
        try {
            const { error } = await supabase.from('profiles').update({ plan_id: newPlanId === 'none' ? null : newPlanId }).eq('id', user.id);
            if (error) throw error;
            toast({ title: "Plano Atualizado!", description: "O plano do utilizador foi alterado com sucesso." });
            mutateUser();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Erro ao alterar plano", description: e.message });
        }
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Status da Conta</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <div>
                        {userPlan ? (
                             <Badge variant="default" className="bg-green-500 hover:bg-green-600"><UserCheck2 className="mr-2 h-4 w-4" /> Ativo</Badge>
                        ) : (
                             <Badge variant="destructive"><UserX2 className="mr-2 h-4 w-4" /> Inativo</Badge>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">{userPlan ? userPlan.title : 'Nenhum plano subscrito'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold">{user.minutes_balance ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Minutos disponíveis</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Subscrição</CardTitle>
                    <CardDescription>Gira o plano de subscrição do utilizador.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!plans ? <Skeleton className="h-10 w-full" /> : (
                        <Select onValueChange={handlePlanChange} value={userPlan?.id || 'none'}>
                            <SelectTrigger><SelectValue placeholder="Selecionar um plano..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhum Plano</SelectItem>
                                {plans?.map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>{plan.title} ({plan.price})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const AppointmentsSection = ({ appointments, isLoading }: { appointments: Appointment[] | null, isLoading: boolean }) => {
    const sortedAppointments = useMemo(() => {
        if (!appointments) return [];
        return [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [appointments]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Agendamentos</CardTitle>
                <CardDescription>Uma lista de todos os agendamentos do utilizador.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-48 w-full" /> : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Data e Hora</TableHead><TableHead>Duração</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {sortedAppointments && sortedAppointments.length > 0 ? (
                            sortedAppointments.map((app) => (
                                <TableRow key={app.id}>
                                <TableCell className="font-medium">{app.service_name}</TableCell>
                                <TableCell>{format(new Date(app.date), "d MMM yyyy, HH:mm", { locale: ptBR })}</TableCell>
                                <TableCell>{app.duration} min</TableCell>
                                <TableCell>
                                    <Badge variant={ app.status === 'Confirmado' ? 'default' : app.status === 'Concluído' ? 'secondary' : 'destructive'} className="capitalize">{app.status}</Badge>
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhum agendamento encontrado.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

const AdvancedSection = ({ user, mutateUser }: { user: UserData, mutateUser: () => void }) => {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleAdminToggle = async (isAdmin: boolean) => {
        if(!supabase) return;
        try {
            const { error } = await supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', user.id);
            if (error) throw error;
            toast({ title: "Permissões Atualizadas!" });
            mutateUser();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Erro", description: e.message });
        }
    };

    const handleDeleteUser = async () => {
        setIsDeleteDialogOpen(false);
        try {
            const response = await fetch('/api/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ocorreu um erro desconhecido.');
            }

            toast({
                title: 'Utilizador Removido!',
                description: `O utilizador ${user.display_name} foi removido com sucesso.`
            });
            router.push('/admin/users');

        } catch (error: any) {
            console.error("Error calling delete user API:", error);
            toast({
                variant: "destructive",
                title: "Erro ao remover utilizador",
                description: error.message,
            });
        }
    };

    return (
        <>
            <Card>
                <CardHeader><CardTitle>Permissões</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label>Administrador</Label>
                            <p className="text-xs text-muted-foreground">Conceder privilégios de administrador a este utilizador.</p>
                        </div>
                        <Switch checked={user.is_admin} onCheckedChange={handleAdminToggle} />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader><CardTitle>Zona de Perigo</CardTitle><CardDescription>Estas ações são permanentes e não podem ser desfeitas.</CardDescription></CardHeader>
                <CardContent>
                    <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Remover Utilizador</Button>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita. Isto irá remover permanentemente o utilizador <span className="font-bold">{user.display_name}</span> do sistema.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};


// --- Main Page Component ---
export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const userId = params.userId as string;
  const [activeSection, setActiveSection] = useState('profile');

  const [user, setUser] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
        const { user, appointments, plans, error } = await getUserById(userId);
        if (error) {
            throw new Error(error);
        }
        setUser(user);
        setAppointments(appointments);
        setPlans(plans);
    } catch (err: any) {
        setError(err.message);
        toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: err.message });
    } finally {
        setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const userPlan = useMemo(() => plans?.find(p => p.id === user?.plan_id) || null, [user, plans]);

  const navItems = [
    { id: 'profile', label: 'Perfil', icon: <User /> },
    { id: 'subscription', label: 'Subscrição', icon: <CreditCard /> },
    { id: 'appointments', label: 'Agendamentos', icon: <List /> },
    { id: 'advanced', label: 'Avançado', icon: <Shield /> },
  ];

  if (isLoading) {
    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6">
            <Skeleton className="h-10 w-24" />
            <div className="grid gap-6 md:grid-cols-[240px_1fr]">
                <Skeleton className="h-64" />
                <Skeleton className="h-96" />
            </div>
        </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold">{error || "Utilizador não encontrado"}</h2>
        <Button onClick={() => router.push('/admin/users')} className="mt-4"><ArrowLeft /> Voltar</Button>
      </div>
    );
  }
  
  const renderSection = () => {
    switch (activeSection) {
      case 'profile': return <ProfileSection user={user} mutateUser={fetchData} />;
      case 'subscription': return <SubscriptionSection user={user} plans={plans} mutateUser={fetchData} />;
      case 'appointments': return <AppointmentsSection appointments={appointments} isLoading={isLoading} />;
      case 'advanced': return <AdvancedSection user={user} mutateUser={fetchData} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <Button variant="ghost" onClick={() => router.push('/admin/users')} className="mb-2"><ArrowLeft /> Voltar para Utilizadores</Button>
                <h1 className="text-3xl font-bold tracking-tight">Editar {user.display_name}</h1>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
            <aside>
                <nav className="flex flex-col gap-1">
                    {navItems.map(item => (
                        <NavItem
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            isActive={activeSection === item.id}
                            onClick={() => setActiveSection(item.id)}
                        />
                    ))}
                </nav>
            </aside>
            <main className="space-y-6">
                {renderSection()}
            </main>
        </div>
    </div>
  );
}
