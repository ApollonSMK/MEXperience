
'use client';

import { ProfilePage } from '@/components/profile/profile-page';
import { CreditCard } from 'lucide-react';

export default function SubscriptionPage() {
  return (
    <ProfilePage
      title="Subscrição"
      description="Gira o seu plano, métodos de pagamento e faturas."
      icon={CreditCard}
    >
      <div className="text-center py-20 bg-muted rounded-lg">
        <p className="text-muted-foreground">
          Detalhes da subscrição e faturação aparecerão aqui.
        </p>
      </div>
    </ProfilePage>
  );
}
