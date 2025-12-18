'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import type { AuthError, Session } from '@supabase/supabase-js';
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
  const router = useRouter();
  const { toast } = useToast();

  const [status, setStatus] = useState<'verifying' | 'verified' | 'error'>('verifying');
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
    let isMounted = true;

    supabase.auth
      .getSessionFromUrl({ storeSession: true })
      .then(
        ({
          data,
          error,
        }: {
          data: { session: Session | null } | null;
          error: AuthError | null;
        }) => {
          if (!isMounted) return;

          if (error || !data?.session) {
            const message =
              error?.message === 'invalid request: both auth code and code verifier should be non-empty'
                ? 'Ce lien a été ouvert dans un autre navigateur ou a expiré. Demandez un nouvel e-mail de réinitialisation et ouvrez-le depuis le même navigateur.'
                : error?.message ?? 'Lien de réinitialisation invalide ou expiré.';
            setStatus('error');
            setStatusMessage(message);
            return;
          }

          setStatus('verified');
        }
      );

    return () => {
      isMounted = false;
    };
  }, [supabase]);

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