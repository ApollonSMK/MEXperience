
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function ReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const [status, setStatus] = useState<'processing' | 'succeeded' | 'error'>('processing');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const paymentIntentId = searchParams.get('payment_intent');

    if (!clientSecret || !paymentIntentId) {
      router.push('/');
      return;
    }

    const verifyPayment = async () => {
      const { paymentIntent } = await supabase.auth.getSession(); // Just to get stripe instance, weird I know
      
      const stripePromise = import('@stripe/stripe-js').then(m => m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!));
      
      const stripe = await stripePromise;
      if (!stripe) {
          setStatus('error');
          setMessage('Ocorreu um erro ao carregar o Stripe. Por favor, tente novamente.');
          return;
      }

      const { error, paymentIntent: retrievedPaymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

      if (error) {
        setStatus('error');
        setMessage(error.message || 'Ocorreu um erro ao verificar o pagamento.');
        return;
      }

      switch (retrievedPaymentIntent?.status) {
        case 'succeeded':
          setStatus('succeeded');
          setMessage('Pagamento bem-sucedido! A sua subscrição está ativa.');
          break;
        case 'processing':
          setStatus('processing');
          setMessage('O seu pagamento está a ser processado. Avisaremos quando estiver concluído.');
          break;
        default:
          setStatus('error');
          setMessage('Ocorreu um erro com o seu pagamento. Por favor, tente novamente.');
          break;
      }
    };

    verifyPayment();
  }, [searchParams, router, supabase]);

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h1 className="text-2xl font-bold">Processando o seu pagamento...</h1>
        <p className="text-muted-foreground">{message || 'Por favor, aguarde um momento.'}</p>
      </div>
    );
  }

  if (status === 'succeeded') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Pagamento bem-sucedido!</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          {message || 'Sua assinatura foi ativada. Um recibo foi enviado para o seu e-mail.'}
        </p>
        <Button onClick={() => router.push('/profile/subscription')}>
          Ver minha assinatura
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <XCircle className="w-24 h-24 text-destructive mb-6" />
      <h1 className="text-3xl font-bold mb-2">Ocorreu um erro</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        {message || 'Não foi possível verificar o estado do seu pagamento. Por favor, verifique a sua página de subscrição ou contacte o suporte.'}
      </p>
      <Button onClick={() => router.push('/abonnements')}>
        Tentar Novamente
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
