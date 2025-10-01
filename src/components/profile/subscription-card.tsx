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
import { CreditCard } from 'lucide-react';
import { UsageChart } from '@/components/usage-chart';

type Subscription = {
  plan: string;
  usedMinutes: number;
  totalMinutes: number;
};

type SubscriptionCardProps = {
  subscription: Subscription;
};

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <CreditCard className="w-8 h-8 text-accent flex-shrink-0" />
          <div>
            <CardTitle className="font-headline text-xl text-primary">
              Minha Subscrição
            </CardTitle>
            <CardDescription>
              Detalhes do seu plano e utilização.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-sm font-medium">Plano Atual</p>
            <p className="font-bold text-accent">{subscription.plan}</p>
          </div>
          <UsageChart used={subscription.usedMinutes} total={subscription.totalMinutes} />
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
