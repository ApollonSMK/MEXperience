'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PartyPopper } from 'lucide-react';

function WelcomePageContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');

  return (
    <Card className="mx-auto max-w-lg w-full text-center">
      <CardHeader>
        <div className="mx-auto bg-accent/10 text-accent p-3 rounded-full w-fit">
            <PartyPopper className="h-10 w-10" />
        </div>
        <CardTitle className="text-3xl font-headline text-primary mt-4">
          Bem-vindo(a), {name || 'Novo Membro'}!
        </CardTitle>
        <CardDescription className="text-lg pt-2">
          A sua conta foi criada com sucesso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Estamos muito felizes por tê-lo(a) connosco. Você já pode explorar tudo o que a M.E Wellness Experience tem para oferecer.
        </p>
        <div className="pt-2">
          <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
            <Link href="/profile">
              Ir para o meu Perfil
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


export default function WelcomePage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12 px-4">
            <Suspense fallback={<div>A carregar...</div>}>
                <WelcomePageContent />
            </Suspense>
        </div>
    )
}
