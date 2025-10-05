
import { ProfilePage } from '@/components/profile/profile-page';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <ProfilePage
      title="Definições"
      description="Atualize os seus dados de perfil e preferências."
      icon={Settings}
    >
      <div className="text-center py-20 bg-muted rounded-lg">
        <p className="text-muted-foreground">
          As opções de definições da conta aparecerão aqui.
        </p>
      </div>
    </ProfilePage>
  );
}
