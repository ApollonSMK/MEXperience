
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { UsageRadarChart } from './usage-radar-chart';
import type { RadarUsageData } from '@/types/usage';

type RadarCardProps = {
  data: RadarUsageData[];
};

export default function RadarCard({ data }: RadarCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <TrendingUp className="w-8 h-8 text-accent" />
          <div>
            <CardTitle className="font-headline text-xl text-primary">
              Seus Favoritos
            </CardTitle>
            <CardDescription>
              Serviços que você mais tem aproveitado.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
           <UsageRadarChart data={data} />
        ) : (
          <div className="text-center py-8 px-4 bg-muted rounded-lg">
            <p className="text-muted-foreground">
                Ainda não há dados de utilização para mostrar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
