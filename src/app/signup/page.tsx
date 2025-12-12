'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { signupUser } from './actions';

const signupSchema = z
  .object({
    firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
    lastName: z.string().min(1, { message: 'Le nom est requis.' }),
    email: z.string().email({ message: 'Adresse e-mail invalide.' }),
    phone: z.string().min(1, { message: 'Le numéro de téléphone est requis.' }),
    dob: z.date({
      required_error: 'Une date de naissance est requise.',
      invalid_type_error: "C'est pas une date valide.",
    }),
    password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.655-3.411-11.303-8H2.389v8.383C8.173,40.63,15.558,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.02,35.622,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref') || searchParams.get('referral'); // Support both ?ref= and ?referral=

  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [dobDay, setDobDay] = useState<string | undefined>();
  const [dobMonth, setDobMonth] = useState<string | undefined>();
  const [dobYear, setDobYear] = useState<string | undefined>();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setIsPageLoading(false);
        if (currentUser) {
          router.push('/profile');
        }
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      const day = parseInt(dobDay, 10);
      const month = parseInt(dobMonth, 10) - 1; // Month is 0-indexed in JS Date
      const year = parseInt(dobYear, 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        form.setValue('dob', date, { shouldValidate: true });
      } else {
        form.setError('dob', { type: 'manual', message: 'Date de naissance invalide.' });
      }
    }
  }, [dobDay, dobMonth, dobYear, form]);

  const password = form.watch('password');

  const passwordStrength = useMemo(() => {
    let strength = 0;
    if (password) {
      if (password.length >= 8) strength += 25;
      if (password.match(/[a-z]/)) strength += 25;
      if (password.match(/[A-Z]/)) strength += 25;
      if (password.match(/[0-9]/)) strength += 25;
    }
    return strength;
  }, [password]);

  const getStrengthColor = (strength: number) => {
    if (strength < 50) return 'bg-red-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setIsGoogleLoading(true);
    
    // Construct redirect URL with referral code if present
    const redirectTo = new URL('/api/auth/callback', window.location.origin);
    if (referralCode) {
        redirectTo.searchParams.set('ref', referralCode);
    }

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectTo.toString()
        }
    });
    if (error) {
        toast({ variant: 'destructive', title: 'Erreur de connexion Google', description: error.message });
        setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    if (!supabase) return;
     if (!data.dob) {
      form.setError('dob', { type: 'manual', message: 'Veuillez sélectionner une date de naissance complète.' });
      return;
    }
    setIsSubmitting(true);
    
    // Use Server Action instead of direct client-side call
    const result = await signupUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        dob: format(data.dob, 'yyyy-MM-dd'),
        referralCode: referralCode
    });

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Oh non! Quelque chose s\'est mal passé.',
        description: result.error || 'Impossible de créer un compte.',
      });
    } else {
        toast({
            title: 'Compte créé!',
            description: "Veuillez vérifier votre e-mail pour confirmer votre compte. Vous serez ensuite redirigé.",
        });
        // Success handled by Auth Listener automatically or we can redirect manually if needed
    }
    setIsSubmitting(false);
  };

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = dobMonth && dobYear ? Array.from({ length: new Date(parseInt(dobYear), parseInt(dobMonth), 0).getDate() }, (_, i) => i + 1) : Array.from({ length: 31 }, (_, i) => i + 1);

  if (isPageLoading || user) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">S'inscrire</CardTitle>
            <CardDescription>Créez un compte pour commencer</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Continuer avec Google
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      OU S'INSCRIRE AVEC L'E-MAIL
                    </span>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom</FormLabel>
                            <FormControl>
                              <Input placeholder="Jean" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom</FormLabel>
                            <FormControl>
                              <Input placeholder="Dupont" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input placeholder="nom@exemple.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="+33 1 23 45 67 89" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dob"
                      render={() => (
                        <FormItem>
                          <FormLabel>Date de naissance</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                            <Select onValueChange={setDobDay} value={dobDay}>
                              <SelectTrigger>
                                <SelectValue placeholder="Jour" />
                              </SelectTrigger>
                              <SelectContent>
                                {days.map((day) => (
                                  <SelectItem key={day} value={String(day)}>
                                    {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select onValueChange={setDobMonth} value={dobMonth}>
                              <SelectTrigger>
                                <SelectValue placeholder="Mois" />
                              </SelectTrigger>
                              <SelectContent>
                                {months.map((month) => (
                                  <SelectItem key={month} value={String(month)}>
                                    {month}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select onValueChange={setDobYear} value={dobYear}>
                              <SelectTrigger>
                                <SelectValue placeholder="Année" />
                              </SelectTrigger>
                              <SelectContent>
                                {years.map((year) => (
                                  <SelectItem key={year} value={String(year)}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type={passwordVisible ? 'text' : 'password'} {...field} />
                              <button
                                type="button"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                              >
                                {passwordVisible ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                              </button>
                            </div>
                          </FormControl>
                          {password && (
                            <div className='space-y-1'>
                              <Progress value={passwordStrength} className={`h-2 ${getStrengthColor(passwordStrength)}`} />
                              <p className="text-xs text-muted-foreground">
                                {passwordStrength < 50 && "Faible"}
                                {passwordStrength >= 50 && passwordStrength < 75 && "Moyen"}
                                {passwordStrength >= 75 && "Fort"}
                              </p>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmer le mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type={confirmPasswordVisible ? 'text' : 'password'} {...field} />
                              <button
                                type="button"
                                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                              >
                                {confirmPasswordVisible ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                       {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Créer un compte
                    </Button>
                  </form>
                </Form>
            </div>
            <div className="mt-4 text-center text-sm">
              Vous avez déjà un compte?{' '}
              <Link href="/login" className="underline">
                Se connecter
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
      <SignupPageContent />
    </Suspense>
  );
}