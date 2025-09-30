
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { LayoutDashboard } from 'lucide-react';
import { BackButton } from '@/components/back-button';

export default function DashboardPage() {
  return (
    <>
      <BackButton />
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <LayoutDashboard className="w-8 h-8 text-accent" />
              <div>
                <CardTitle className="font-headline text-2xl text-primary">
                  Dashboard
                </CardTitle>
                <CardDescription>
                  A sua visão geral de atividade e bem-estar.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-20 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                O conteúdo do Dashboard aparecerá aqui.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
