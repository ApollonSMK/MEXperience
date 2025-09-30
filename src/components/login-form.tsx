"use client";

import Image from 'next/image';
import Link from 'next/link';
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
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { login, signupWithGoogle } from '@/app/auth/actions';
import { useActionState, useEffect, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Checkbox } from './ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';

function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        required
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

export function LoginForm({ image }: { image?: ImagePlaceholder }) {
  const [errorMessage, dispatch, isPending] = useActionState(login, undefined);
  const [rememberMe, setRememberMe] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localStorage.getItem('rememberMe') === 'true' && emailRef.current) {
      emailRef.current.value = localStorage.getItem('email') || '';
      setRememberMe(true);
    }
  }, []);

  const handleFormAction = (formData: FormData) => {
    if (rememberMe) {
      localStorage.setItem('email', formData.get('email') as string);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('email');
      localStorage.removeItem('rememberMe');
    }
    dispatch(formData);
  };

  return (
    <Card className="w-full">
      <div className="grid lg:grid-cols-2">
        <div className="p-6">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-accent">
              Login
            </CardTitle>
            <CardDescription>
              Entre com seu email para acessar sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleFormAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  name="email"
                  placeholder="m@exemplo.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
                <PasswordInput />
              </div>
              <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                    <label
                        htmlFor="remember-me"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Lembrar-me
                    </label>
                 </div>
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
              <LoginButton />
            </form>
            <form action={signupWithGoogle}>
              <Button variant="outline" className="w-full mt-4">
                Entrar com Google
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Não tem uma conta?{' '}
              <Link href="/signup" className="underline text-accent">
                Cadastre-se
              </Link>
            </div>
          </CardContent>
        </div>
        <div className="hidden bg-muted lg:block relative">
          {image && (
            <Image
              src={image.imageUrl}
              alt={image.description}
              fill
              className="object-cover rounded-r-lg"
              data-ai-hint={image.imageHint}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full bg-primary hover:bg-primary/90"
      disabled={pending}
    >
      {pending ? 'A entrar...' : 'Login'}
    </Button>
  );
}
