
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { EditUserForm } from '@/components/admin/users/edit-user-form';
import type { Profile } from '@/types/profile';
import { User, Shield, CreditCard, Gift } from 'lucide-react';

type UserPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

const getInitials = (name: string | undefined | null) => {
  if (!name) return '??';
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.length > 2 ? initials.substring(0, 2) : initials;
};

// Modificada para ir buscar dados do profile e do auth.users
async function getUserData(userId: string): Promise<Profile> {
  const supabase = createClient({ auth: { persistSession: false } });

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
        *,
        user:auth_users(created_at)
    `)
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.error("Error fetching user data for details page:", error);
    notFound();
  }

  // A consulta retorna `user` como um objeto, precisamos de o achatar
  const userData = Array.isArray(profile.user) ? profile.user[0] : profile.user;
  
  return {
    ...profile,
    created_at: userData?.created_at || profile.created_at, // Usa a data do auth.users se existir
  };
}

export default async function UserProfileAdminPage(props: UserPageProps) {
  const params = await props.params;
  const profile = await getUserData(params.userId);

  return (
    <div className="container mx-auto max-w-6xl py-12">
      <div className="flex items-center mb-6">
        <BackButton />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: User Info */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-28 w-28 border-4 border-accent/20">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
                <AvatarFallback className="text-4xl">{getInitials(profile.full_name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
              </div>
               {profile.role === 'admin' && (
                 <span className="text-xs font-semibold inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                    <Shield className="mr-1.5 h-3.5 w-3.5" />
                    Admin
                 </span>
                )}
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4 pt-4">
                 <div>
                    <p className="font-semibold text-foreground">Membro desde</p>
                    <p>{new Date(profile.created_at).toLocaleDateString('pt-PT')}</p>
                </div>
                 <div>
                    <p className="font-semibold text-foreground">Telefone</p>
                    <p>{profile.phone || 'Não fornecido'}</p>
                  </div>
                 <div>
                    <p className="font-semibold text-foreground">ID do Utilizador</p>
                    <p className="font-mono text-xs bg-muted p-2 rounded-md break-all">{profile.id}</p>
                  </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Editing and Stats */}
        <div className="md:col-span-2 space-y-6">
           <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-accent" />
                    <div>
                        <CardTitle>Gerir Subscrição</CardTitle>
                        <CardDescription>Altere o plano de subscrição e os minutos de bónus.</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <EditUserForm userProfile={profile} />
              </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
