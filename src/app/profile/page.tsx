'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ArrowLeft, CreditCard, LogOut, User as UserIcon, FileText, Calendar } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

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
    stripe_subscription_status?: string;
}

interface Plan {
    id: string;
    title: string;
    minutes: number;
}

const profileSchema = z.object({
  first_name: z.string().min(1, { message: 'Le prénom est requis.' }),
  last_name: z.string().min(1, { message: 'Le nom est requis.' }),
  email: z.string().email(),
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        first_name: "",
        last_name: "",
        email: ""
    }
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
        password: "",
        confirmPassword: ""
    }
  });

  const isUpdatingProfile = profileForm.formState.isSubmitting;
  const isUpdatingPassword = passwordForm.formState.isSubmitting;

  const fetchData = useCallback(async (currentUser: User) => {
    if (!supabase) return;
    
    setIsLoading(true);
    
    const profilePromise = supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    const plansPromise = supabase.from('plans').select('*').order('order');

    const [
        { data: profile, error: profileError },
        { data: plansData, error: plansError },
    ] = await Promise.all([profilePromise, plansPromise]);

    if (profileError) {
        if (profileError.code === 'PGRST116') {
            // Perfil não existe (Login Google novo).
            // Preenchemos o formulário com os dados da autenticação para facilitar.
            const meta = currentUser.user_metadata || {};
            const fullName = meta.full_name || meta.name || '';
            const parts = fullName.split(' ');
            
            profileForm.reset({
                first_name: parts[0] || "",
                last_name: parts.slice(1).join(' ') || "",
                email: currentUser.email || ""
            });
            toast({ title: "Bienvenue !", description: "Veuillez compléter votre profil (téléphone) pour continuer." });
        } else {
            console.error('Error fetching profile', profileError);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger votre profil. ' + profileError.message });
        }
    } else {
        setUserData(profile);
        if (profile) {
             profileForm.reset({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                email: profile.email || currentUser.email || ""
            });
        }
    }
    
    if (plansError) console.error('Error fetching plans', plansError);
    else setPlans(plansData || []);

    setIsLoading(false);
  }, [supabase, toast, profileForm]);

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

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    try {
        const { error } = await supabase.from('profiles').update({
            first_name: values.first_name,
            last_name: values.last_name,
            display_name: `${values.first_name} ${values.last_name}`
        }).eq('id', user.id);
        
        if (error) throw error;
        
        toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées avec succès." });
        fetchData(user);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    try {
        const { error } = await supabase.auth.updateUser({ password: values.password });
        if (error) throw error;
        toast({ title: "Mot de passe mis à jour", description: "Votre mot de passe a été modifié avec succès." });
        passwordForm.reset();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

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
  
  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            {/* Sidebar */}
            <div className="md:col-span-1 space-y-2">
                <Button variant="ghost" className="w-full justify-start font-semibold bg-accent">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Détails du Compte
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/profile/subscription')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Abonnement
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/profile/invoices')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Factures
                </Button>
                 <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/profile/appointments')}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Rendez-vous
                </Button>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations Personnelles</CardTitle>
                        <CardDescription>Mettez à jour vos informations personnelles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
                                <FormField
                                    control={profileForm.control}
                                    name="first_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prénom</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Prénom" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="last_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nom" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="email@example.com" {...field} disabled />
                                            </FormControl>
                                            <FormDescription>
                                                L'adresse email ne peut pas être modifiée ici.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isUpdatingProfile}>
                                    {isUpdatingProfile ? "Mise à jour..." : "Mettre à jour les informations"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sécurité</CardTitle>
                        <CardDescription>Gérez votre mot de passe.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                                <FormField
                                    control={passwordForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nouveau mot de passe</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirmer le mot de passe</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isUpdatingPassword}>
                                    {isUpdatingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                                </Button>
                            </form>
                        </Form>
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