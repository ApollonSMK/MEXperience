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
import { User, ShieldCheck } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type UserProfileCardProps = {
  user: SupabaseUser;
  isAdmin: boolean;
};

export default function UserProfileCard({ user, isAdmin }: UserProfileCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start gap-4">
          <User className="w-8 h-8 text-accent flex-shrink-0" />
          <div>
            <CardTitle className="font-headline text-xl text-primary">
              Meu Perfil
            </CardTitle>
            <CardDescription>
              Consulte e edite as suas informações.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Nome</p>
          <p className="text-muted-foreground">{user.user_metadata?.full_name}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Email</p>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <ShieldCheck className="w-5 h-5 text-accent"/>
            <p className="text-sm font-semibold">Você é um administrador.</p>
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
