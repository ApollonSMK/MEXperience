'use client';

import { FormEvent, useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Input } from './ui/input';

interface PaymentFormProps {
    userEmail: string;
    amount: number;
    onSuccessfulPayment: () => void;
}

export function PaymentForm({ userEmail, amount, onSuccessfulPayment }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Não é necessário return_url, pois lidamos com o sucesso/erro aqui mesmo.
      },
      redirect: 'if_required' // Impede o redirecionamento automático
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur de Paiement',
        description: error.message,
      });
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // A lógica de atualização do perfil e criação da fatura é chamada aqui
        onSuccessfulPayment();
    } else {
       toast({
        variant: 'destructive',
        title: 'Paiement Inattendu',
        description: `Statut du paiement : ${paymentIntent?.status}`,
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <Input type="email" value={userEmail} disabled className="bg-muted" />
        <PaymentElement />
        <Button disabled={isLoading || !stripe} className="w-full" size="lg">
            {isLoading ? <Loader2 className="animate-spin" /> : `Payer €${amount.toFixed(2)}`}
        </Button>
    </form>
  );
}
