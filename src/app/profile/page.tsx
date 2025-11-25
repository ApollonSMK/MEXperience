'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CreditCard, LogOut, User as UserIcon, FileText, Calendar, Ticket, Clock } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Link from 'next/link';

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
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

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
        setIsProfileSheetOpen(false);
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
        setIsProfileSheetOpen(false);
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
      <main className="min-h-screen bg-gray-50/50 dark:bg-zinc-900/50 py-10">
        <div className="container mx-auto max-w-5xl px-4 space-y-8">
            
            {/* Top Profile Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Decoration */}
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
                    <AvatarImage src={userData?.photo_url} />
                    <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                        {userData?.first_name?.[0]}{userData?.last_name?.[0]}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left space-y-4 relative z-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {userData?.display_name || 'Utilisateur'}
                        </h1>
                        <p className="text-gray-500 font-medium">{userData?.email}</p>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                            <CreditCard className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-primary">{userPlan?.title || 'Aucun plan actif'}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-green-500/5 px-4 py-2 rounded-full border border-green-500/10">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-600">{userData?.minutes_balance || 0} min</span>
                            <span className="text-xs text-green-600/70">disponibles</span>
                        </div>
                    </div>
                </div>

                <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors z-20" onClick={handleSignOut}>
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>

            {/* Bento Grid Menu */}
            <BentoGrid>
                {/* Subscription */}
                <Link href="/profile/subscription" className="md:col-span-2 row-span-1 group">
                    <BentoGridItem
                        title="Mon Abonnement"
                        description="Gérez votre plan, votre méthode de paiement et visualisez votre utilisation détaillée."
                        header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800/80" />}
                        icon={<CreditCard className="h-4 w-4 text-primary" />}
                        className="h-full cursor-pointer"
                    />
                </Link>

                {/* Invites */}
                <Link href="/profile/invite" className="md:col-span-1 row-span-1 group">
                    <BentoGridItem
                        title="Parrainage & Invités"
                        description="Invitez des amis et partagez vos minutes."
                        header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800/80" />}
                        icon={<Ticket className="h-4 w-4 text-primary" />}
                        className="h-full cursor-pointer"
                    />
                </Link>

                {/* Profile Edit - Opens Sheet */}
                <div onClick={() => setIsProfileSheetOpen(true)} className="md:col-span-1 row-span-1 group cursor-pointer">
                    <BentoGridItem
                        title="Mes Informations"
                        description="Mettez à jour vos coordonnées et mot de passe."
                        header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800/80" />}
                        icon={<UserIcon className="h-4 w-4 text-primary" />}
                        className="h-full"
                    />
                </div>

                {/* Appointments */}
                <Link href="/profile/appointments" className="md:col-span-1 row-span-1 group">
                    <BentoGridItem
                        title="Mes Rendez-vous"
                        description="Historique et prochaines séances."
                        header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800/80" />}
                        icon={<Calendar className="h-4 w-4 text-primary" />}
                        className="h-full cursor-pointer"
                    />
                </Link>

                {/* Invoices */}
                <Link href="/profile/invoices" className="md:col-span-1 row-span-1 group">
                    <BentoGridItem
                        title="Factures"
                        description="Téléchargez vos reçus de paiement."
                        header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800/80" />}
                        icon={<FileText className="h-4 w-4 text-primary" />}
                        className="h-full cursor-pointer"
                    />
                </Link>
            </BentoGrid>
        </div>

        <Sheet open={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen}>
            <SheetContent className="overflow-y-auto sm:max-w-md w-full">
                <SheetHeader className="mb-6">
                    <SheetTitle>Modifier le Profil</SheetTitle>
                    <SheetDescription>Mettez à jour vos informations personnelles ici.</SheetDescription>
                </SheetHeader>
                
                <div className="space-y-8 pb-10">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Informations Personnelles</h3>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
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
                                                <Input placeholder="email@example.com" {...field} disabled className="bg-muted" />
                                            </FormControl>
                                            <FormDescription>
                                                L'adresse email ne peut pas être modifiée ici.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isUpdatingProfile} className="w-full">
                                    {isUpdatingProfile ? "Mise à jour..." : "Sauvegarder les modifications"}
                                </Button>
                            </form>
                        </Form>
                    </div>

                    <div className="h-px bg-border my-2"></div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sécurité</h3>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
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
                                <Button type="submit" variant="outline" disabled={isUpdatingPassword} className="w-full">
                                    {isUpdatingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
      </main>
      <Footer />
    </>
  );
}