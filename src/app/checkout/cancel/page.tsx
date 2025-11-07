'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <XCircle className="w-24 h-24 text-destructive mb-6" />
      <h1 className="text-3xl font-bold mb-2">Paiement Annulé</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Le processus de paiement a été annulé. Vous n'avez pas été débité.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push('/#pricing')}>
            Revoir les plans
        </Button>
        <Button variant="outline" onClick={() => router.push('/')}>
            Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}
