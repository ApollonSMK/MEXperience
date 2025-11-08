'use client';

import { useState } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { Plan } from '@/app/admin/plans/page';

interface CheckoutFormProps {
    user: User;
    plan: Plan;
    clientSecret: string;
}

const cardElementOptions = {
    style: {
        base: {
            color: 'hsl(var(--foreground))',
            fontFamily: '"Inter", sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: 'hsl(var(--muted-foreground))',
            },
        },
        invalid: {
            color: 'hsl(var(--destructive))',
            iconColor: 'hsl(var(--destructive))',
        },
    },
};

export function CheckoutForm({ user, plan, clientSecret }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }
    
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Elemento do cartão não encontrado.' });
        return;
    }

    setIsProcessing(true);
    setMessage(null);
    
    const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
            card: cardElement,
            billing_details: {
                name: user.user_metadata?.display_name || user.email,
                email: user.email,
            },
        },
    });

    if (error) {
        setMessage(error.message || "Ocorreu um erro inesperado.");
        toast({ variant: 'destructive', title: 'Erro no Pagamento', description: error.message });
    } else {
        toast({ title: 'Pagamento bem-sucedido!', description: 'A sua subscrição está a ser ativada.' });
        router.push('/checkout/success');
    }

    setIsProcessing(false);
  };
  
   return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <CardElement id="card-element" options={cardElementOptions} />
      <Button disabled={isProcessing || !stripe || !elements} id="submit" className="w-full">
        <span id="button-text">
          {isProcessing ? <Loader2 className="animate-spin" /> : `Pagar ${plan.price} e Subscrever`}
        </span>
      </Button>
      {message && <div id="payment-message" className="text-destructive text-sm mt-2">{message}</div>}
    </form>
  );
}
