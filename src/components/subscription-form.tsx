'use client';

import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useState, type FormEvent } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Plan } from '@/app/admin/plans/page';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import * as pixel from '@/lib/fpixel';
import { useEffect } from 'react';

interface SubscriptionFormProps {
    plan: Plan;
    user: User;
}

export function SubscriptionForm({ plan, user }: SubscriptionFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Track InitiateCheckout quando o formulário monta
    pixel.event('InitiateCheckout', {
        content_name: plan.title,
        content_ids: [plan.id],
        content_type: 'product',
        value: parseFloat(plan.price.replace(/[^0-9.]/g, '')),
        currency: 'EUR',
        num_items: 1
    });
  }, [plan]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
        return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    
    // Track AddPaymentInfo quando clica em pagar
    pixel.event('AddPaymentInfo', {
        content_name: plan.title,
        value: parseFloat(plan.price.replace(/[^0-9.]/g, '')),
        currency: 'EUR'
    });

    const { error: submitError } = await elements.submit();
    if (submitError) {
        setErrorMessage(submitError.message || "Ocorreu um erro ao submeter o formulário.");
        setIsLoading(false);
        return;
    }
    
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/return?type=subscription`,
      },
      redirect: 'if_required', 
    });

    if (error) {
      setErrorMessage(error.message || "Ocorreu um erro inesperado.");
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        try {
          const response = await fetch('/api/stripe/confirm-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ payment_intent_id: paymentIntent.id }),
          });

          const result = await response.json();
          if (!response.ok) {
              throw new Error(result.error || 'Ocorreu um erro desconhecido.');
          }

          toast({
              title: 'Subscrição Ativada!',
              description: "O seu plano foi ativado com sucesso. Será redirecionado em breve.",
          });
          
          router.push(`/checkout/return?type=subscription&redirect_status=succeeded`);

      } catch (error: any) {
          console.error("Error in post-payment confirmation:", error);
          toast({
              variant: 'destructive',
              title: 'Erro Pós-Pagamento',
              description: `O seu pagamento foi processado, mas ocorreu um erro ao atualizar a sua conta. ${error.message}`,
          });
      } finally {
        setIsLoading(false);
      }
    } else {
        setErrorMessage("O pagamento não foi bem-sucedido. Por favor, tente novamente.");
        setIsLoading(false);
    }
  };
  
  const priceNumber = parseFloat(plan.price.replace('€', ''));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" />
       {errorMessage && <div className="text-destructive text-sm font-medium">{errorMessage}</div>}
      <Button disabled={isLoading || !stripe || !elements} className="w-full" size="lg">
        {isLoading ? <Loader2 className="animate-spin"/> : `Payer €${priceNumber.toFixed(2)}`}
      </Button>
    </form>
  );
}