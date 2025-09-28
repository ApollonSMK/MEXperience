'use client';

import Link from 'next/link';
import { useActionState, useFormStatus } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signup, signupWithGoogle } from '@/app/auth/actions';

export default function SignupPage() {
  const [errorMessage, dispatch] = useActionState(signup, undefined);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12 px-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-accent">
            Cadastro
          </CardTitle>
          <CardDescription>
            Crie sua conta para agendar e gerenciar suas experiências.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Nome Completo</Label>
              <Input
                id="full-name"
                name="full_name"
                placeholder="Seu nome completo"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@exemplo.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" name="password" required />
            </div>
            {errorMessage && (
              <div
                className="flex items-center gap-2 text-sm text-destructive"
                aria-live="polite"
                aria-atomic="true"
              >
                <p>{errorMessage}</p>
              </div>
            )}
            <SignupButton />
          </form>
          <form action={signupWithGoogle}>
            <Button variant="outline" className="w-full mt-4">
              Cadastrar com Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{' '}
            <Link href="/login" className="underline text-accent">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SignupButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full bg-primary hover:bg-primary/90"
      disabled={pending}
    >
      {pending ? 'A criar conta...' : 'Criar Conta'}
    </Button>
  );
}
