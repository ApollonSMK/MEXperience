'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { Checkbox } from '@/components/ui/checkbox';
import { signup, signupWithGoogle } from '@/app/auth/actions';
import { Eye, EyeOff } from 'lucide-react';

function PasswordInput({
  id,
  name,
  placeholder,
}: {
  id: string;
  name: string;
  placeholder: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        name={name}
        placeholder={placeholder}
        required
        minLength={6}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
        onClick={() => setShowPassword((prev) => !prev)}
      >
        {showPassword ? <EyeOff /> : <Eye />}
        <span className="sr-only">
          {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        </span>
      </Button>
    </div>
  );
}

export default function SignupPage() {
  const [errorMessage, dispatch] = useActionState(signup, undefined);
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12 px-4">
      <Card className="mx-auto max-w-lg w-full">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">Nome</Label>
                <Input id="first-name" name="first_name" placeholder="Seu nome" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Sobrenome</Label>
                <Input id="last-name" name="last_name" placeholder="Seu sobrenome" required />
              </div>
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
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                placeholder="912 345 678"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput id="password" name="password" placeholder="••••••••" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <PasswordInput id="confirm-password" name="confirm_password" placeholder="••••••••" />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" name="terms" onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Aceito os{' '}
                <Link href="/terms" className="underline text-accent">
                  termos e condições
                </Link>
              </label>
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
            <SignupButton termsAccepted={termsAccepted} />
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>
          <form action={signupWithGoogle}>
            <Button variant="outline" className="w-full">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.641-3.657-11.303-8.62H6.306C9.656 35.663 16.318 40 24 40z" />
                <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.171 44 30.023 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
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

function SignupButton({ termsAccepted }: { termsAccepted: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full bg-primary hover:bg-primary/90"
      disabled={pending || !termsAccepted}
    >
      {pending ? 'A criar conta...' : 'Criar Conta'}
    </Button>
  );
}
