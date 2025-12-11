'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Gift, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { verifyAndCreateGiftCard } from '@/app/actions/gift-cards';

function CheckoutReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const paymentIntentId = searchParams.get('payment_intent');
  const setupIntentId = searchParams.get('setup_intent'); // Add support for Setup Intents (Trials)
  const redirectStatus = searchParams.get('redirect_status');
  const type = searchParams.get('type'); // Get the type (subscription, gift_card, etc)
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [giftCode, setGiftCode] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // If we have a redirect_status of succeeded, we consider it a success primarily
    if (redirectStatus === 'succeeded') {
        const idToVerify = paymentIntentId || setupIntentId;

        // If it's a subscription, we often just need to know it succeeded
        if (type === 'subscription') {
             setStatus('success');
             setMessage("Abonnement activé avec succès !");
             return;
        }

        // If we don't have an ID but status is success, it's weird but let's be lenient if we can't verify
        if (!idToVerify) {
            console.warn("No intent ID found but status is succeeded.");
            setStatus('success');
            setMessage("Opération réussie.");
            return;
        }

        const processPayment = async () => {
            try {
                // Attempt to verify/create gift card only if we have a payment intent
                if (paymentIntentId) {
                    const result = await verifyAndCreateGiftCard(paymentIntentId);
                    
                    if (result.success && result.code) {
                        setGiftCode(result.code);
                        setStatus('success');
                        setMessage("Votre carte cadeau a été générée avec succès !");
                    } else if (result.error === 'Not a gift card payment') {
                        setStatus('success');
                        setMessage("Paiement confirmé.");
                    } else {
                        console.error(result.error);
                        setStatus('success'); 
                        setMessage("Paiement réussi.");
                    }
                } else {
                    // It was a setup intent or something else
                    setStatus('success');
                    setMessage("Confirmation réussie.");
                }
            } catch (e) {
                console.error(e);
                setStatus('success'); // Fallback to success if payment succeeded even if verification threw
            }
        };

        processPayment();
    } else if (redirectStatus === 'processing') {
         setStatus('loading');
         setMessage("Paiement en cours de traitement...");
    } else {
        // If redirect_status is missing or failed
        if (!redirectStatus) {
            // Check if we just landed here without params (error)
            setStatus('failed');
        } else {
            setStatus('failed');
        }
    }
  }, [redirectStatus, paymentIntentId, setupIntentId, type]);

  const handleContinue = () => {
      if (giftCode) {
          router.push('/profile/gift-cards');
      } else {
          router.push('/profile/appointments');
      }
  };

  const copyToClipboard = () => {
      if (giftCode) {
          navigator.clipboard.writeText(giftCode);
          toast({ title: "Copié !" });
      }
  };

  if (status === 'loading') {
      return (
          <div className="flex flex-col h-screen items-center justify-center bg-background gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Finalisation de votre commande...</p>
          </div>
      );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center shadow-xl border-t-4 border-t-primary">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            {status === 'success' ? (
                giftCode ? <Gift className="h-10 w-10 text-primary" /> : <CheckCircle className="h-10 w-10 text-primary" />
            ) : (
                <XCircle className="h-10 w-10 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'success' ? 'Merci pour votre commande !' : 'Échec du Paiement'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {status === 'success' 
                ? (giftCode 
                    ? "Votre carte cadeau est prête. Un email de confirmation a également été envoyé." 
                    : message || "Votre transaction a été traitée avec succès.")
                : "Nous n'avons pas pu traiter votre paiement. Veuillez réessayer."
            }
          </p>

          {/* DISPLAY GIFT CODE IF AVAILABLE */}
          {giftCode && (
              <div className="bg-muted p-6 rounded-lg border border-dashed border-primary/50 relative group">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Votre Code Cadeau</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-mono font-bold text-primary tracking-wider">{giftCode}</span>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                    </Button>
                  </div>
              </div>
          )}

        </CardContent>
        <CardFooter className="flex flex-col gap-3">
            {status === 'success' ? (
                <Button className="w-full h-11 text-base" onClick={handleContinue}>
                    {giftCode ? "Voir mes cartes cadeaux" : "Continuer vers mon espace"}
                </Button>
            ) : (
                <Button className="w-full" onClick={() => router.back()}>
                    Réessayer
                </Button>
            )}
            <Button variant="link" size="sm" asChild>
                <a href="/">Retour à l'accueil</a>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
      <CheckoutReturnContent />
    </Suspense>
  );
}