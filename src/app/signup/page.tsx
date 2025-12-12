'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Eye, EyeOff, Loader2, CalendarIcon, ChevronLeft, ArrowRight, User as UserIcon, Mail, Phone, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { signupUser } from './actions';
import { Separator } from '@/components/ui/separator';

const signupSchema = z
  .object({
    firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
    lastName: z.string().min(1, { message: 'Le nom est requis.' }),
    email: z.string().email({ message: 'Adresse e-mail invalide.' }),
    phone: z.string().min(1, { message: 'Le numéro de téléphone est requis.' }),
    dob: z.date({
      required_error: 'La date de naissance est requise.',
      invalid_type_error: "Date invalide.",
    }),
    password: z.string().min(6, { message: 'Min. 6 caractères.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mots de passe différents.',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
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
  const referralCode = searchParams.get('ref') || searchParams.get('referral');

  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Date state
  const [dobDay, setDobDay] = useState<string>("");
  const [dobMonth, setDobMonth] = useState<string>("");
  const [dobYear, setDobYear] = useState<string>("");

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

  // Update form date when select values change
  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      const day = parseInt(dobDay, 10);
      const month = parseInt(dobMonth, 10) - 1; // Month is 0-indexed
      const year = parseInt(dobYear, 10);
      
      const date = new Date(year, month, day);
      
      // Validação extra para datas impossíveis (ex: 31 Fev)
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        form.setValue('dob', date, { shouldValidate: true });
      } else {
        // Se for inválido, podemos limpar ou deixar o erro aparecer no submit
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
    if (strength < 50) return 'bg-destructive';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setIsGoogleLoading(true);
    
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
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    if (!supabase) return;
    
    setIsSubmitting(true);
    
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
        title: 'Erreur',
        description: result.error,
      });
      setIsSubmitting(false);
    } else {
        toast({
            title: 'Bienvenue!',
            description: "Compte créé avec succès.",
        });
        if (result.session) {
            await supabase.auth.setSession(result.session);
        }
        router.refresh();
        router.push('/profile');
    }
  };

  // Generate Date Arrays
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i)); // Text for Select
  const months = [
    { value: "1", label: "Janvier" }, { value: "2", label: "Février" }, { value: "3", label: "Mars" },
    { value: "4", label: "Avril" }, { value: "5", label: "Mai" }, { value: "6", label: "Juin" },
    { value: "7", label: "Juillet" }, { value: "8", label: "Août" }, { value: "9", label: "Septembre" },
    { value: "10", label: "Octobre" }, { value: "11", label: "Novembre" }, { value: "12", label: "Décembre" }
  ];
  
  // Calculate days based on month/year if selected, else default 31
  const getDaysInMonth = (m: string, y: string) => {
    if (!m || !y) return 31;
    return new Date(parseInt(y), parseInt(m), 0).getDate();
  };
  
  const daysInMonth = getDaysInMonth(dobMonth, dobYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

  if (isPageLoading || user) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-muted/30 px-4 py-8 md:py-12">
        <div className="w-full max-w-md space-y-6">
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Créer un compte</h1>
            <p className="text-muted-foreground">Rejoignez-nous pour accéder à tous les services.</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-4 pb-6">
              <Button 
                variant="outline" 
                className="w-full h-11 relative font-medium" 
                onClick={handleGoogleLogin} 
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <GoogleIcon />
                  </div>
                )}
                Continuer avec Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou par e-mail
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input placeholder="Jean" {...field} className="h-10" />
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
                            <Input placeholder="Dupont" {...field} className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Email & Phone */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="exemple@mail.com" className="pl-9 h-10" {...field} />
                          </div>
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
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="06 12 34 56 78" className="pl-9 h-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date of Birth - Custom Selects */}
                  <FormField
                    control={form.control}
                    name="dob"
                    render={() => (
                      <FormItem>
                        <FormLabel>Date de naissance</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          <Select onValueChange={setDobDay} value={dobDay}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Jour" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[200px]">
                              {days.map((d) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select onValueChange={setDobMonth} value={dobMonth}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Mois" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[200px]">
                              {months.map((m) => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select onValueChange={setDobYear} value={dobYear}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Année" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[200px]">
                              {years.map((y) => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={passwordVisible ? 'text' : 'password'} 
                              className="pl-9 pr-10 h-10" 
                              placeholder="••••••"
                              {...field} 
                            />
                            <button
                              type="button"
                              onClick={() => setPasswordVisible(!passwordVisible)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        {password && (
                            <div className="flex gap-1 h-1 mt-2 w-full overflow-hidden rounded-full bg-secondary">
                                <div className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`} style={{ width: `${passwordStrength}%` }} />
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
                        <FormLabel>Confirmer</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={confirmPasswordVisible ? 'text' : 'password'} 
                              className="pl-9 pr-10 h-10" 
                              placeholder="••••••"
                              {...field} 
                            />
                            <button
                              type="button"
                              onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {confirmPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full h-11 text-base mt-2" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Créer mon compte"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 border-t bg-muted/20 p-6">
              <div className="text-center text-sm text-muted-foreground">
                Déjà membre ?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
                  Se connecter
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <SignupPageContent />
    </Suspense>
  );
}