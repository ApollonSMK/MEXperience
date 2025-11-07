'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Optionally, redirect after a few seconds
    const timer = setTimeout(() => {
      router.push('/profile/subscription');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
      <h1 className="text-3xl font-bold mb-2">Paiement Réussi !</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Votre souscription a été activée. Merci de votre confiance. Vous allez être redirigé vers votre profil.
      </p>
      <Button onClick={() => router.push('/profile/subscription')}>
        Aller à mon abonnement
      </Button>
    </div>
  );
}
