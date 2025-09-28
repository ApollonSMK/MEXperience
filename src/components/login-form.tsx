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

export function LoginForm({ image }: { image?: ImagePlaceholder }) {
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
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
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
                <Input id="password" type="password" required />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
              >
                Login
              </Button>
              <Button variant="outline" className="w-full">
                Entrar com Google
              </Button>
            </div>
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
