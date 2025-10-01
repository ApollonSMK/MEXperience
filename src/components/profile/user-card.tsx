'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
      ? (totalUsedMinutes / subscription.totalMinutes) * 100
      : 0;

  return (
    <Card>
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
      <CardContent className="space-y-6">
        {subscription.plan !== 'Sem Plano' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Minutos Restantes</span>
              <span className="font-semibold">
                {remainingMinutes} / {subscription.totalMinutes} min
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
        <div className="space-y-4 pt-4">
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
      <CardFooter className="flex flex-col gap-2">
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
