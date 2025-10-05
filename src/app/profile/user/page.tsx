'use client';

import { ProfilePage } from '@/components/profile/profile-page';
import { User } from 'lucide-react';

export default function UserProfilePage() {
  return (
    <ProfilePage
      title="Meu Perfil"
      description="Consulte e edite os seus dados pessoais e de acesso."
      icon={User}
    >
      <div className="text-center py-20 bg-muted rounded-lg">
        <p className="text-muted-foreground">
          O formulário para editar os dados do perfil aparecerá aqui.
        </p>
      </div>
    </ProfilePage>
  );
}
