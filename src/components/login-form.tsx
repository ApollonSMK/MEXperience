"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline text-accent">Login</CardTitle>
        <CardDescription>
          Entre com seu email para acessar sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1">
            <Button variant="outline">
              Entrar com Google
            </Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Ou continue com
            </span>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@exemplo.com" />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Senha</Label>
             <Link href="#" className="ml-auto inline-block text-sm underline">
                  Esqueceu sua senha?
             </Link>
          </div>
          <Input id="password" type="password" />
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
          Entrar
        </Button>
      </CardContent>
       <div className="p-6 pt-0 mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/signup" className="underline text-accent">
              Cadastre-se
            </Link>
        </div>
    </Card>
  )
}
