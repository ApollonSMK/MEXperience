'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone, Calendar as CalendarIcon, Star, Trash2, Clock, FilePlus2, User, CreditCard, List, Shield, AlertTriangle, UserCheck2, UserX2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
import { getUserById, updateUser } from '../actions';
import { Progress } from '@/components/ui/progress';


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
  first_name: z.string().min(1, 'Le prénom est requis.'),
  last_name: z.string().min(1, 'Le nom est requis.'),
  phone: z.string().min(1, 'Le téléphone est requis.'),
  dob: z.date({ required_error: 'La date de naissance est requise.' }),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const subscriptionSchema = z.object({
    plan_id: z.string().nullable(),
    minutes_balance: z.coerce.number().int().min(0, 'Le solde de minutes ne peut pas être négatif.').optional(),
});
type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;


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

  const [dobDay, setDobDay] = useState<string | undefined>();
  const [dobMonth, setDobMonth] = useState<string | undefined>();
  const [dobYear, setDobYear] = useState<string | undefined>();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
    },
  });

  useEffect(() => {
    if (user) {
        form.reset({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
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
    const dataToUpdate = {
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: `${data.first_name} ${data.last_name}`,
        phone: data.phone,
        dob: format(data.dob, 'yyyy-MM-dd'),
    };

    const { success, error } = await updateUser(user.id, dataToUpdate);

    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: error });
    } else {
      toast({ title: "Utilisateur mis à jour !", description: "Les données de l'utilisateur ont été enregistrées." });
      mutateUser();
    }
  };
  
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = dobMonth && dobYear ? Array.from({ length: new Date(parseInt(dobYear), parseInt(dobMonth), 0).getDate() }, (_, i) => i + 1) : Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Gérer les données personnelles de cet utilisateur.</CardDescription>
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
                          <FormLabel>Prénom</FormLabel>
                          <FormControl><Input placeholder="Ana" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="last_name" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Nom</FormLabel>
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
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl><Input placeholder="+351 912 345 678" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
             <FormField control={form.control} name="dob" render={() => (
                <FormItem>
                    <FormLabel>Date de Naissance</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                    <Select onValueChange={setDobDay} value={dobDay}>
                        <SelectTrigger><SelectValue placeholder="Jour" /></SelectTrigger>
                        <SelectContent>{days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={setDobMonth} value={dobMonth}>
                        <SelectTrigger><SelectValue placeholder="Mois" /></SelectTrigger>
                        <SelectContent>{months.map(m => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={setDobYear} value={dobYear}>
                        <SelectTrigger><SelectValue placeholder="Année" /></SelectTrigger>
                        <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    </div>
                    <FormMessage />
                </FormItem>
             )} />
          </CardContent>
          <CardFooter className="border-t px-6 py-4 justify-end">
             <Button type="submit" disabled={form.formState.isSubmitting}>Enregistrer les modifications</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

const SubscriptionSection = ({ user, plans, mutateUser }: { user: UserData, plans: Plan[] | null, mutateUser: () => void }) => {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);

    const userPlan = useMemo(() => {
        if (!user.plan_id || !plans) return null;
        return plans.find(p => p.id === user.plan_id);
    }, [user.plan_id, plans]);

    const remainingMinutes = user.minutes_balance || 0;
    const totalMinutes = userPlan?.minutes || 0;
    const progressPercentage = totalMinutes > 0 ? (remainingMinutes / totalMinutes) * 100 : 0;

    const form = useForm<SubscriptionFormValues>({
        resolver: zodResolver(subscriptionSchema),
        defaultValues: {
            plan_id: user.plan_id || null,
            minutes_balance: user.minutes_balance ?? 0,
        },
    });

     useEffect(() => {
        form.reset({
            plan_id: user.plan_id || null,
            minutes_balance: user.minutes_balance ?? 0,
        });
    }, [user, form, isEditing]);
    
    const onSubmit = async (data: SubscriptionFormValues) => {
        const dataToUpdate = {
            plan_id: data.plan_id === 'none' ? null : data.plan_id,
            minutes_balance: data.minutes_balance,
        };

        const { success, error } = await updateUser(user.id, dataToUpdate);

        if (error) {
            toast({ variant: "destructive", title: "Erreur lors de la mise à jour de l'abonnement", description: error });
        } else {
            toast({ title: "Abonnement mis à jour !", description: "Les données de l'abonnement ont été enregistrées." });
            mutateUser();
            setIsEditing(false);
        }
    };
    
    return (
        <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle>Abonnement</CardTitle>
                            <CardDescription>Gérer le plan et le solde de minutes de l'utilisateur.</CardDescription>
                        </div>
                        {!isEditing && (
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isEditing ? (
                             <div className="space-y-6 animate-in fade-in-0">
                                <FormField
                                    control={form.control}
                                    name="plan_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Plan d'abonnement</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || 'none'}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner un plan..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Aucun Plan</SelectItem>
                                                    {plans?.map(plan => (
                                                        <SelectItem key={plan.id} value={plan.id}>
                                                            {plan.title} ({plan.price})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="minutes_balance"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Solde de Minuites</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <Label>Plan Actuel</Label>
                                    <p className="font-semibold text-lg">{userPlan?.title || 'Aucun plan actif'}</p>
                                    {userPlan && <Badge variant="secondary">{userPlan.price}</Badge>}
                                </div>
                                <Separator />
                                <div>
                                    <Label>Solde de Minuites</Label>
                                    <p className="font-semibold text-lg">{remainingMinutes} minutes</p>
                                    {userPlan && (
                                        <>
                                            <Progress value={progressPercentage} className="mt-2 h-2" />
                                            <p className="text-xs text-muted-foreground mt-1">sur {totalMinutes} minutes</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                    {isEditing && (
                         <CardFooter className="border-t px-6 py-4 justify-end gap-2">
                             <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Annuler</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                Enregistrer l'abonnement
                            </Button>
                        </CardFooter>
                    )}
                </form>
            </Form>
        </Card>
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
                <CardTitle>Historique des Rendez-vous</CardTitle>
                <CardDescription>Liste de tous les rendez-vous de l'utilisateur.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-48 w-full" /> : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Date et Heure</TableHead><TableHead>Durée</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {sortedAppointments && sortedAppointments.length > 0 ? (
                            sortedAppointments.map((app) => (
                                <TableRow key={app.id}>
                                <TableCell className="font-medium">{app.service_name}</TableCell>
                                <TableCell>{format(new Date(app.date), "d MMM yyyy, HH:mm", { locale: fr })}</TableCell>
                                <TableCell>{app.duration} min</TableCell>
                                <TableCell>
                                    <Badge variant={ app.status === 'Confirmado' ? 'default' : app.status === 'Concluído' ? 'secondary' : 'destructive'} className="capitalize">{app.status}</Badge>
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow><TableCell colSpan={4} className="text-center h-24">Aucun rendez-vous trouvé.</TableCell></TableRow>
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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleAdminToggle = async (isAdmin: boolean) => {
        const { success, error } = await updateUser(user.id, { is_admin: isAdmin });
        if (error) {
            toast({ variant: "destructive", title: "Erreur", description: error });
        } else {
            toast({ title: "Permissions mises à jour !" });
            mutateUser();
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
                throw new Error(result.error || 'Une erreur inconnue est survenue.');
            }

            toast({
                title: 'Utilisateur Supprimé !',
                description: `L'utilisateur ${user.display_name} a été supprimé avec succès.`
            });
            router.push('/admin/users');

        } catch (error: any) {
            console.error("Error calling delete user API:", error);
            toast({
                variant: "destructive",
                title: "Erreur lors de la suppression",
                description: error.message,
            });
        }
    };

    return (
        <>
            <Card>
                <CardHeader><CardTitle>Permissions</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label>Administrateur</Label>
                            <p className="text-xs text-muted-foreground">Accorder les droits d'administrateur à cet utilisateur.</p>
                        </div>
                        <Switch checked={user.is_admin} onCheckedChange={handleAdminToggle} />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader><CardTitle>Zone de Danger</CardTitle><CardDescription>Ces actions sont irréversibles.</CardDescription></CardHeader>
                <CardContent>
                    <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Supprimer l'utilisateur</Button>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible. Cela supprimera définitivement l'utilisateur <span className="font-bold">{user.display_name}</span> du système.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
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
        toast({ variant: 'destructive', title: 'Erreur lors du chargement', description: err.message });
    } finally {
        setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const navItems = [
    { id: 'profile', label: 'Profil', icon: <User /> },
    { id: 'subscription', label: 'Abonnement', icon: <CreditCard /> },
    { id: 'appointments', label: 'Rendez-vous', icon: <List /> },
    { id: 'advanced', label: 'Avancé', icon: <Shield /> },
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
        <h2 className="text-2xl font-bold">{error || "Utilisateur non trouvé"}</h2>
        <Button onClick={() => router.push('/admin/users')} className="mt-4"><ArrowLeft /> Retour</Button>
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
                <Button variant="ghost" onClick={() => router.push('/admin/users')} className="mb-2"><ArrowLeft /> Retour aux utilisateurs</Button>
                <h1 className="text-3xl font-bold tracking-tight">Modifier {user.display_name}</h1>
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