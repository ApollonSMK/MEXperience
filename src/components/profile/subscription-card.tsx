
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
import { BarChart3 } from 'lucide-react';
import { UsageChart } from '@/components/usage-chart';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

const getBadgeVariant = (plan: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (plan.includes('Gold')) return 'default';
  if (plan.includes('Prata')) return 'secondary';
  if (plan.includes('Bronze')) return 'outline';
  return 'destructive';
};


export default function SubscriptionCard({ subscription, usageData }: SubscriptionCardProps) {
  const totalUsedMinutes = usageData.reduce((acc, item) => acc + item.minutes, 0);
  const remainingMinutes = Math.max(0, subscription.totalMinutes - totalUsedMinutes);

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
                 <Badge 
                    variant={getBadgeVariant(subscription.plan)}
                    className={cn('text-base font-bold', {
                      'bg-yellow-400 text-black hover:bg-yellow-400/80': subscription.plan === 'Plano Gold',
                      'bg-slate-300 text-black hover:bg-slate-300/80': subscription.plan === 'Plano Prata',
                       'bg-orange-300 text-black hover:bg-orange-300/80': subscription.plan === 'Plano Bronze',
                    })}
                  >
                    {subscription.plan}
                  </Badge>
            </div>
             {subscription.plan !== 'Sem Plano' && (
              <div className="text-sm text-right">
                  <p className="text-muted-foreground">Minutos Restantes</p>
                  <p className="font-bold text-lg">{remainingMinutes} / {subscription.totalMinutes} min</p>
              </div>
            )}
            <div className="text-sm text-right">
                <p className="text-muted-foreground">Total Utilizado (30d)</p>
                <p className="font-bold text-lg">{totalUsedMinutes} min</p>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Mudar de Plano</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
