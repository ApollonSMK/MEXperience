'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, initiateEmailSignUp, setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Eye, EyeOff } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


const signupSchema = z
  .object({
    firstName: z.string().min(1, { message: 'Le nom est requis.' }),
    lastName: z.string().min(1, { message: 'Le nom de famille est requis.' }),
    email: z.string().email({ message: 'Adresse e-mail invalide.' }),
    phone: z.string().min(1, { message: 'Le numéro de téléphone est requis.' }),
    dob: z.date({
      required_error: 'Une date de naissance est requise.',
    }),
    password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

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

  useEffect(() => {
    if (!isUserLoading && user) {
      const userRef = doc(firestore, 'users', user.uid);
      const values = form.getValues();
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        email: user.email,
        displayName: `${values.firstName} ${values.lastName}`,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        dob: values.dob,
        photoURL: user.photoURL,
        creationTime: serverTimestamp(),
        lastSignInTime: serverTimestamp(),
      }, { merge: true });
      router.push('/profile');
    }
  }, [user, isUserLoading, router, firestore, form]);
  
  const onSubmit = async (data: SignupFormValues) => {
    try {
      initiateEmailSignUp(auth, data.email, data.password);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Oh non! Quelque chose s\'est mal passé.',
        description: error.message || 'Impossible de créer un compte.',
      });
    }
  };

  if (isUserLoading || (!isUserLoading && user)) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">S'inscrire</CardTitle>
            <CardDescription>Créez un compte pour commencer</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
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
                        <FormLabel>Sobrenome</FormLabel>
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
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date de naissance</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Sélectionnez une date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                          <Progress value={passwordStrength} className={cn("h-2", getStrengthColor(passwordStrength))} />
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
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  Créer un compte
                </Button>
              </form>
            </Form>
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
