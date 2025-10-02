
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { DollarSign, Users, Calendar, Activity } from 'lucide-react';

const stats = [
  {
    title: 'Receita Total',
    value: '€45,231.89',
    change: '+20.1% do último mês',
    icon: DollarSign,
  },
  {
    title: 'Novos Utilizadores',
    value: '+2350',
    change: '+180.1% do último mês',
    icon: Users,
  },
  {
    title: 'Agendamentos (Mês)',
    value: '+12,234',
    change: '+19% do último mês',
    icon: Calendar,
  },
  {
    title: 'Taxa de Atividade',
    value: '+573',
    change: '+201 desde a última hora',
    icon: Activity,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="text-center py-20 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                    Gráficos e informações do dashboard aparecerão aqui.
                </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
