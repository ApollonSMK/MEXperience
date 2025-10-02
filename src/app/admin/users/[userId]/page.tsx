
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type UserPageProps = {
  params: {
    userId: string;
  };
};

const getInitials = (name: string | undefined | null) => {
  if (!name) return '??';
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.length > 2 ? initials.substring(0, 2) : initials;
};

async function getUserProfile(userId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    notFound();
  }

  return profile;
}

export default async function UserProfileAdminPage({ params }: UserPageProps) {
  const profile = await getUserProfile(params.userId);

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="flex items-center justify-between mb-8">
        <BackButton />
        <h1 className="text-3xl font-headline font-bold text-primary">
          Perfil do Utilizador
        </h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-6 space-y-0 pb-6">
          <Avatar className="h-24 w-24 border">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
            <AvatarFallback className="text-3xl">{getInitials(profile.full_name)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-sm">
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-muted-foreground">ID do Utilizador</p>
                <p className="font-mono bg-muted p-2 rounded-md">{profile.id}</p>
              </div>
               <div>
                <p className="font-semibold text-muted-foreground">Telefone</p>
                <p>{profile.phone || 'Não fornecido'}</p>
              </div>
            </div>
             <div className="space-y-4">
                <div>
                  <p className="font-semibold text-muted-foreground">Plano de Subscrição</p>
                  <p>{profile.subscription_plan || 'Nenhum'}</p>
                </div>
                 <div>
                    <p className="font-semibold text-muted-foreground">Membro desde</p>
                    <p>{new Date(profile.created_at).toLocaleDateString('pt-PT')}</p>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
