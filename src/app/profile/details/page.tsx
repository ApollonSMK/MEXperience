'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User as UserIcon, Lock, Mail, Phone, Camera, Loader2, Save, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Schemas
const profileSchema = z.object({
  first_name: z.string().min(1, { message: 'Le prénom est requis.' }),
  last_name: z.string().min(1, { message: 'Le nom est requis.' }),
  email: z.string().email(),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: 'Minimum 6 caractères.' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export default function ProfileDetailsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);

    // Forms
    const profileForm = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            phone: ""
        }
    });

    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: "",
            confirmPassword: ""
        }
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setUser(currentUser);
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (profile) {
            setUserData(profile);
            profileForm.reset({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                email: currentUser.email || "",
                phone: profile.phone || ""
            });
        }
        setIsLoading(false);
    }, [supabase, router, profileForm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
        try {
            const { error } = await supabase.from('profiles').update({
                first_name: values.first_name,
                last_name: values.last_name,
                phone: values.phone,
                display_name: `${values.first_name} ${values.last_name}`
            }).eq('id', user.id);
            
            if (error) throw error;
            
            toast({ title: "Succès", description: "Informations mises à jour." });
            fetchData(); // Refresh to update UI
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erreur", description: error.message });
        }
    };

    const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
        try {
            const { error } = await supabase.auth.updateUser({ password: values.password });
            if (error) throw error;
            toast({ title: "Succès", description: "Mot de passe modifié." });
            passwordForm.reset();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erreur", description: error.message });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Chargement...</p>
                 </div>
            </div>
        );
    }

    return (
        <>
            <Header />
            <main className="flex min-h-screen flex-col bg-background pb-12">
                
                {/* HEADER BANNER */}
                <div className="w-full bg-slate-50 dark:bg-slate-900/50 border-b py-8 mb-8">
                    <div className="container mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                             <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 shrink-0 bg-background hover:bg-background/80">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Mes Informations</h1>
                                <p className="text-sm text-muted-foreground">Gérez vos coordonnées et votre sécurité.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto max-w-5xl px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        
                        {/* LEFT COLUMN: Profile Summary */}
                        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                            <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden text-center">
                                <CardContent className="pt-8 pb-8 flex flex-col items-center">
                                    <div className="relative mb-4 group cursor-pointer">
                                        <Avatar className="h-28 w-28 border-4 border-slate-50 shadow-lg">
                                            <AvatarImage src={userData?.photo_url} />
                                            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                                                {userData?.first_name?.[0]}{userData?.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 rounded-full p-2 border shadow-sm group-hover:scale-110 transition-transform">
                                            <Camera className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    
                                    <h2 className="text-xl font-bold">{userData?.display_name || 'Utilisateur'}</h2>
                                    <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
                                    
                                    <div className="w-full border-t pt-4 mt-2">
                                        <div className="flex justify-between text-sm py-1">
                                            <span className="text-muted-foreground">Membre depuis</span>
                                            <span className="font-medium">{new Date(user.created_at).getFullYear()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-1">
                                            <span className="text-muted-foreground">Status</span>
                                            <span className="font-medium text-green-600">Actif</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Forms */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Personal Info Card */}
                            <Card>
                                <CardHeader className="border-b bg-slate-50/40 dark:bg-slate-900/40">
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg">Informations Personnelles</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Mettez à jour vos informations d'identité.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <Form {...profileForm}>
                                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={profileForm.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Email</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                    <Input {...field} disabled className="pl-9 bg-muted" />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={profileForm.control}
                                                    name="phone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Téléphone</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                    <Input placeholder="+352 691..." {...field} className="pl-9" />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                                                    {profileForm.formState.isSubmitting ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="mr-2 h-4 w-4" />
                                                    )}
                                                    Enregistrer
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>

                            {/* Security Card */}
                            <Card>
                                <CardHeader className="border-b bg-slate-50/40 dark:bg-slate-900/40">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg">Sécurité</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Gérez votre mot de passe et l'accès au compte.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <Form {...passwordForm}>
                                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={passwordForm.control}
                                                    name="password"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Nouveau mot de passe</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                    <Input type="password" placeholder="••••••" {...field} className="pl-9" />
                                                                </div>
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
                                                            <FormLabel>Confirmer</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                    <Input type="password" placeholder="••••••" {...field} className="pl-9" />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            
                                            <div className="flex justify-end pt-2">
                                                <Button type="submit" variant="outline" disabled={passwordForm.formState.isSubmitting}>
                                                    {passwordForm.formState.isSubmitting ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                                                </Button>
                                            </div>
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