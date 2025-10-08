
'use client';

import { ProfilePage } from '@/components/profile/profile-page';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  return (
    <ProfilePage
      title="Dashboard"
      description="A sua visão geral de atividade e bem-estar."
      icon={LayoutDashboard}
    >
      <div className="text-center py-20 bg-muted rounded-lg">
        <p className="text-muted-foreground">
          O conteúdo do Dashboard aparecerá aqui.
        </p>
      </div>
    </ProfilePage>
  );
}
