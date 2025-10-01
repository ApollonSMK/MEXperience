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
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

const getInitials = (name: string) => {
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.length > 2 ? initials.substring(0, 2) : initials;
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

  const fullName = user.user_metadata?.full_name || '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border">
            <AvatarImage
              src={user.user_metadata?.picture}
              alt={fullName}
            />
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl text-primary">
              {fullName}
            </CardTitle>
             <p className="text-sm text-muted-foreground">{user.email}</p>
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
