'use client';

import { useStripe, useElements, PaymentElement, ExpressCheckoutElement } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    // Este ponto normalmente não é alcançado em fluxos de sucesso porque o utilizador é redirecionado.
    // O erro só será exibido se houver um erro imediato na confirmação do pagamento.
    if (error.type === "card_error" || error.type === "validation_error") {
      toast({
        variant: 'destructive',
        title: 'Erreur de paiement',
        description: error.message,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Erreur inattendue',
        description: "Une erreur inattendue est survenue lors du paiement.",
      });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
            <ExpressCheckoutElement onConfirm={handleSubmit} />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou payez par carte
                </span>
              </div>
            </div>
            <PaymentElement 
                options={{
                    paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
                }}
            />
        </div>
      <Button disabled={!stripe || isLoading} className="w-full mt-6">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <span>{isLoading ? 'Traitement...' : 'Payer et S\'abonner'}</span>
      </Button>
    </form>
  );
};

export default CheckoutForm;
