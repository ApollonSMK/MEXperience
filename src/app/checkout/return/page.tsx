
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function ReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'complete' | 'open'>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
        router.replace('/');
        return;
    }
    
    const fetchSessionStatus = async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        try {
            const response = await fetch(`/api/stripe/checkout-status?session_id=${sessionId}`);
            const session = await response.json();
            
            setStatus(session.status);

            if (session.status === 'complete') {
                setMessage('Pagamento bem-sucedido! A sua subscrição está ativa.');
                setTimeout(() => {
                    router.push('/profile/subscription');
                }, 3000);
            } else if (session.status === 'open') {
                setMessage('O pagamento falhou ou foi cancelado. Por favor, tente novamente.');
                 setTimeout(() => {
                    router.push('/abonnements');
                }, 3000);
            }
        } catch (error) {
            console.error(error);
            setStatus('open');
            setMessage('Algo correu mal ao verificar o estado do pagamento.');
        }
    };

    fetchSessionStatus();
  }, [searchParams, router]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h1 className="text-2xl font-bold">A verificar o seu pagamento...</h1>
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
            {message} Será redirecionado em breve.
        </p>
        <Button onClick={() => router.push('/profile/subscription')}>
          Ver minha assinatura
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <AlertCircle className="w-24 h-24 text-destructive mb-6" />
      <h1 className="text-3xl font-bold mb-2">Pagamento Incompleto</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        {message}
      </p>
       <div className="flex gap-4">
        <Button onClick={() => router.push('/abonnements')}>
            Tentar Novamente
        </Button>
        <Button variant="outline" asChild>
            <Link href="/">
                Página Inicial
            </Link>
        </Button>
      </div>
    </div>
  );
}

export default function ReturnPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando...</div>}>
            <ReturnContent />
        </Suspense>
    )
}
