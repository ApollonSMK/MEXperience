'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';
import { resendConfirmationEmail } from '@/app/auth/actions';
import { useToast } from '@/hooks/use-toast';

function ConfirmEmailPageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { toast } = useToast();

  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0 || !email || isResending) return;

    setIsResending(true);
    const result = await resendConfirmationEmail(email);
    setIsResending(false);
    
    if (result.success) {
      setCooldown(30);
      toast({
        title: "Sucesso!",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.message,
      });
    }
  };

  if (!email) {
    return (
        <Card className="mx-auto max-w-md w-full">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Email não encontrado</CardTitle>
                <CardDescription>Não foi possível encontrar o email. Por favor, tente registar-se novamente.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg w-full text-center">
      <CardHeader>
        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
            <MailCheck className="h-10 w-10" />
        </div>
        <CardTitle className="text-3xl font-headline text-primary mt-4">
          Confirme o seu email
        </CardTitle>
        <CardDescription className="text-lg pt-2">
          Enviámos um link de confirmação para <br />
          <span className="font-bold text-foreground">{email}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Por favor, verifique a sua caixa de entrada e a pasta de spam. Clique no link para ativar a sua conta.
        </p>
        <div className="pt-2">
          <Button
            onClick={handleResendEmail}
            disabled={cooldown > 0 || isResending}
            className="w-full"
          >
            {isResending 
              ? 'A reenviar...' 
              : cooldown > 0 
                ? `Reenviar em ${cooldown}s`
                : 'Reenviar email'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground pt-4">
          Não recebeu o email? Verifique a sua pasta de spam ou clique no botão acima para reenviar.
        </p>
      </CardContent>
    </Card>
  );
}


export default function ConfirmEmailPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12 px-4">
            <Suspense fallback={<div>A carregar...</div>}>
                <ConfirmEmailPageContent />
            </Suspense>
        </div>
    )
}