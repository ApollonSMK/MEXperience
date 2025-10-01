'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, BarChart3 } from 'lucide-react';
import { UsageChart } from '@/components/usage-chart';

type UsageData = {
  date: string;
  minutes: number;
};

type Subscription = {
  plan: string;
  totalMinutes: number;
};

type SubscriptionCardProps = {
  subscription: Subscription;
  usageData: UsageData[];
};

export default function SubscriptionCard({ subscription, usageData }: SubscriptionCardProps) {
  const totalUsedMinutes = usageData.reduce((acc, item) => acc + item.minutes, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <BarChart3 className="w-8 h-8 text-accent flex-shrink-0" />
          <div>
            <CardTitle className="font-headline text-xl text-primary">
              Histórico de Utilização
            </CardTitle>
            <CardDescription>
              Minutos gastos nos últimos 30 dias.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
         <UsageChart data={usageData} />
         <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm">
                <p className="text-muted-foreground">Plano Atual</p>
                <p className="font-bold text-accent">{subscription.plan}</p>
            </div>
            <div className="text-sm text-right">
                <p className="text-muted-foreground">Total Utilizado</p>
                <p className="font-bold text-lg">{totalUsedMinutes} min</p>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/profile/subscription">Gerir Subscrição</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
