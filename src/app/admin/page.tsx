
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { LayoutDashboard } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-16">
       <div className="mb-12">
        <h1 className="text-4xl font-headline font-bold text-primary">
          Painel de Administração
        </h1>
        <p className="mt-2 text-muted-foreground">
          Visão geral do seu sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <LayoutDashboard className="w-8 h-8 text-accent" />
            <div>
              <CardTitle className="font-headline text-2xl text-primary">
                Dashboard
              </CardTitle>
              <CardDescription>
                Métricas e estatísticas importantes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              O conteúdo do dashboard do admin aparecerá aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
