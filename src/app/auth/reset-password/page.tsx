'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import type { AuthError } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const resetSchema = z
  .object({
    password: z.string().min(6, {
      message: 'Le mot de passe doit contenir au moins 6 caractères.',
    }),
    confirmPassword: z.string().min(6, {
      message: 'Veuillez confirmer votre mot de passe.',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const code = searchParams.get('code');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setStatusMessage('Lien de réinitialisation invalide ou expiré.');
      return;
    }

    let isMounted = true;
    setStatus('verifying');

    supabase.auth.exchangeCodeForSession(code).then(
      ({ error: sessionError }: { error: AuthError | null }) => {
        if (!isMounted) return;

        if (sessionError) {
          setStatus('error');
          setStatusMessage(
            sessionError.message === 'Invalid code exchange'
              ? 'Ce lien a expiré. Demandez un nouvel e-mail de réinitialisation.'
              : sessionError.message
          );
          return;
        }

        setStatus('verified');
      }
    );

    return () => {
      isMounted = false;
    };
  }, [code, supabase.auth]);

  const onSubmit = async (values: ResetFormValues) => {
    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Impossible de mettre à jour le mot de passe',
        description: error.message,
      });
    } else {
      toast({
        title: 'Mot de passe mis à jour',
        description: 'Votre mot de passe a été réinitialisé avec succès.',
      });
      router.replace('/profile');
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          {status === 'verifying' ? (
            <CardHeader className="items-center text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <CardTitle>Vérification du lien…</CardTitle>
              <CardDescription>Merci de patienter quelques secondes.</CardDescription>
            </CardHeader>
          ) : null}

          {status === 'error' ? (
            <>
              <CardHeader className="space-y-2 text-center">
                <CardTitle>Impossible de continuer</CardTitle>
                <CardDescription>{statusMessage}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Button onClick={() => router.replace('/login')}>Retour à la connexion</Button>
              </CardContent>
            </>
          ) : null}

          {status === 'verified' ? (
            <>
              <CardHeader className="space-y-2 text-center">
                <CardTitle>Définissez votre nouveau mot de passe</CardTitle>
                <CardDescription>
                  Choisissez un mot de passe robuste afin de sécuriser votre compte.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nouveau mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmez le mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Mettre à jour le mot de passe
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          ) : null}
        </Card>
      </main>
      <Footer />
    </>
  );
}