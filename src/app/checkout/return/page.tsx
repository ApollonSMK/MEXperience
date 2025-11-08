'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'complete' | 'open' | 'error'>('loading');
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }

    const fetchSessionStatus = async () => {
      try {
        const res = await fetch(`/api/stripe/session-status?session_id=${sessionId}`);
        if (!res.ok) {
            throw new Error('Failed to fetch session status');
        }
        const data = await res.json();
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
      } catch (error) {
        console.error(error);
        setStatus('error');
      }
    };

    fetchSessionStatus();
  }, [sessionId, router]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h1 className="text-2xl font-bold">Finalizando seu pagamento...</h1>
        <p className="text-muted-foreground">Por favor, aguarde um momento.</p>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Pagamento bem-sucedido!</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Sua assinatura foi ativada. Um recibo foi enviado para {customerEmail}.
        </p>
        <Button onClick={() => router.push('/profile/subscription')}>
          Ver minha assinatura
        </Button>
      </div>
    );
  }

  if (status === 'open') {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <XCircle className="w-24 h-24 text-destructive mb-6" />
            <h1 className="text-3xl font-bold mb-2">Pagamento não concluído</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                Seu pagamento não foi concluído. Se você acha que isso é um erro, por favor, tente novamente.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => router.push('/abonnements')}>
                    Rever planos
                </Button>
                <Button variant="outline" onClick={() => router.push('/')}>
                    Voltar ao início
                </Button>
            </div>
        </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <XCircle className="w-24 h-24 text-destructive mb-6" />
      <h1 className="text-3xl font-bold mb-2">Ocorreu um erro</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Não foi possível verificar o estado do seu pagamento. Por favor, verifique a sua página de subscrição ou contacte o suporte.
      </p>
      <Button onClick={() => router.push('/')}>
        Voltar ao início
      </Button>
    </div>
  );
}

export default function ReturnPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ReturnContent />
        </Suspense>
    )
}
