'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ui/progress-ring';

type UsageData = {
  date: string;
  minutes: number;
};

type Subscription = {
  plan: string;
  totalMinutes: number;
};

type UserProfileCardProps = {
  user: SupabaseUser;
  isAdmin: boolean;
  subscription: Subscription;
  usageData: UsageData[];
};

export default function UserProfileCard({
  user,
  isAdmin,
  subscription,
  usageData,
}: UserProfileCardProps) {
  const totalUsedMinutes = usageData.reduce(
    (acc, item) => acc + item.minutes,
    0
  );
  const remainingMinutes = Math.max(
    0,
    subscription.totalMinutes - totalUsedMinutes
  );
  const progressPercentage =
    subscription.totalMinutes > 0
      ? (remainingMinutes / subscription.totalMinutes) * 100
      : 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-4">
          <User className="w-8 h-8 text-accent flex-shrink-0" />
          <div>
            <CardTitle className="font-headline text-xl text-primary">
              Meu Perfil
            </CardTitle>
          </div>
        </div>
        {isAdmin && <Badge variant="secondary">Admin</Badge>}
      </CardHeader>
      <CardContent className="space-y-6 flex-grow">
        {subscription.plan !== 'Sem Plano' && (
          <div className="flex flex-col items-center gap-4 text-center p-4 rounded-lg bg-muted">
            <p className="text-sm font-medium text-muted-foreground">
              Minutos Restantes
            </p>
            <ProgressRing value={progressPercentage}>
              <div className="text-center">
                <span className="text-3xl font-bold text-primary">
                  {remainingMinutes}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{subscription.totalMinutes}
                </span>
              </div>
            </ProgressRing>
          </div>
        )}
        <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Nome</p>
              <p className="text-muted-foreground">
                {user.user_metadata?.full_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 mt-auto">
        <Button asChild variant="outline" className="w-full">
          <Link href="/profile/user">Editar Perfil</Link>
        </Button>
        {isAdmin && (
          <Button asChild className="w-full">
            <Link href="/admin">Painel de Admin</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
