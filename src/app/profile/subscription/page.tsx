
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function SubscriptionPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CreditCard className="w-8 h-8 text-accent" />
            <div>
              <CardTitle className="font-headline text-2xl text-primary">
                Subscrição
              </CardTitle>
              <CardDescription>
                Gira o seu plano, métodos de pagamento e faturas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              Detalhes da subscrição e faturação aparecerão aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
