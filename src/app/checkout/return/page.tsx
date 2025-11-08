
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getStripe } from '@/lib/stripe';


function ReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'processing'>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');

    if (!clientSecret) {
        router.replace('/');
        return;
    }
    
    const fetchPaymentStatus = async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);
        if (!stripe) return;

        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        switch (paymentIntent?.status) {
            case 'succeeded':
                setStatus('success');
                setMessage('Pagamento bem-sucedido! A sua subscrição está ativa.');
                 setTimeout(() => {
                    router.push('/profile/subscription');
                }, 5000);
                break;
            case 'processing':
                setStatus('processing');
                setMessage('O seu pagamento está a ser processado. Iremos notificá-lo quando estiver concluído.');
                break;
            case 'requires_payment_method':
                setStatus('error');
                setMessage('O pagamento falhou. Por favor, tente um método de pagamento diferente.');
                break;
            default:
                setStatus('error');
                setMessage('Algo correu mal. Por favor, tente novamente.');
                break;
        }
    };

    fetchPaymentStatus();
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

  if (status === 'success') {
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
      <h1 className="text-3xl font-bold mb-2">Pagamento Falhou</h1>
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
