
'use client';

import { ProfilePage } from '@/components/profile/profile-page';
import { BarChart3 } from 'lucide-react';

export default function StatisticsPage() {
  return (
    <ProfilePage
      title="Estatísticas"
      description="Analise o seu uso e progresso ao longo do tempo."
      icon={BarChart3}
    >
      <div className="text-center py-20 bg-muted rounded-lg">
        <p className="text-muted-foreground">
          Gráficos e estatísticas de utilização aparecerão aqui.
        </p>
      </div>
    </ProfilePage>
  );
}
