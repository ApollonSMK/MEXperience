'use client';

import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AppointmentCheckoutFormProps {
  appointmentDetails: any;
}

export const AppointmentCheckoutForm = ({ appointmentDetails }: AppointmentCheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(undefined);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/return?type=appointment`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setErrorMessage(error.message);
    } else {
      setErrorMessage("Une erreur inattendue est survenue.");
    }

    setIsProcessing(false);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-4">Résumé de la Réservation</h1>
        <Card>
          <CardHeader>
            <CardTitle>{appointmentDetails.serviceName}</CardTitle>
            <CardDescription>
                Rendez-vous le {format(new Date(appointmentDetails.appointmentDate), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Durée</span>
                <span>{appointmentDetails.duration} minutes</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Client</span>
                <span>{appointmentDetails.userName}</span>
             </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total à Payer</span>
              <span>€{appointmentDetails.price.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div id="checkout">
        <h1 className="text-2xl font-bold mb-4">Détails de Paiement</h1>
        <form onSubmit={handleSubmit}>
          <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
          <Button 
            className="w-full mt-6" 
            size="lg" 
            type="submit" 
            disabled={isProcessing || !stripe || !elements}
            id="submit"
          >
            <span id="button-text">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Payer €${appointmentDetails.price.toFixed(2)}`}
            </span>
          </Button>

          {errorMessage && (
            <div id="payment-message" className="p-4 mt-4 text-sm text-destructive bg-destructive/10 rounded-md">
              {errorMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
