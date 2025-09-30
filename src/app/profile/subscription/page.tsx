
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { BackButton } from '@/components/back-button';

export default function SubscriptionPage() {
  return (
    <div className="bg-muted min-h-svh w-full lg:grid lg:grid-cols-6">
      <div className="hidden border-r bg-background lg:block" />
      <div className="col-span-3 lg:col-span-5 lg:border-l">
        <div className="px-4 py-6 lg:px-8">
            <BackButton />
            <div className="container mx-auto max-w-5xl px-4 pb-16">
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
        </div>
      </div>
    </div>
  );
}
