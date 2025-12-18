'use client';

import { useState } from 'react';
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
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Loader2, AlertCircle } from 'lucide-react';
import { ForgotPasswordDialog } from '@/components/forgot-password-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const loginSchema = z.object({
  email: z.string().email({ message: 'Adresse e-mail invalide.' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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

export default function LoginView() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isForgotDialogOpen, setIsForgotDialogOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setIsGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
    });

    if (error) {
        toast({ variant: 'destructive', title: 'Erreur de connexion Google', description: error.message });
        setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    if (!supabase) return;
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
        setErrorMessage(error.message === 'Invalid login credentials' 
            ? 'Identifiants invalides. Veuillez vérifier votre email et mot de passe.' 
            : error.message);
        setErrorModalOpen(true);
    } else {
      router.push('/profile');
    }
    setIsLoading(false);
  };

  const handleOpenForgotPassword = () => {
    setForgotEmail(form.getValues('email') || '');
    setIsForgotDialogOpen(true);
  };

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <AlertDialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Erreur de connexion
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                        {errorMessage}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setErrorModalOpen(false)}>Réessayer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Card className="mx-auto w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>Entrez votre e-mail ci-dessous pour vous connecter à votre compte</CardDescription>
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
                      OU
                    </span>
                  </div>
                </div>
            
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Se connecter
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="w-full"
                      onClick={handleOpenForgotPassword}
                    >
                      Mot de passe oublié ?
                    </Button>
                  </form>
                </Form>
            </div>
            <div className="mt-4 text-center text-sm">
              Vous n'avez pas de compte?{' '}
              <Link href={'/signup'} className="underline">
                S'inscrire
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
      <ForgotPasswordDialog
        open={isForgotDialogOpen}
        onOpenChange={setIsForgotDialogOpen}
        email={forgotEmail}
      />
    </>
  );
}