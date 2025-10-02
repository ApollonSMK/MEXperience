
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { DollarSign, Users, Calendar, Activity, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

const revenueData = [
    { date: 'Set 22', revenue: 2300 },
    { date: 'Set 23', revenue: 2900 },
    { date: 'Set 24', revenue: 2100 },
    { date: 'Set 25', revenue: 2200 },
    { date: 'Set 26', revenue: 1900 },
    { date: 'Set 27', revenue: 1800 },
    { date: 'Set 28', revenue: 1700 },
    { date: 'Set 29', revenue: 1800 },
    { date: 'Set 30', revenue: 3500 },
    { date: 'Out 01', revenue: 2800 },
    { date: 'Out 02', revenue: 2900 },
    { date: 'Out 03', revenue: 2500 },
    { date: 'Out 04', revenue: 2700 },
    { date: 'Out 05', revenue: 2100 },
];

const upcomingAppointments = [
    {
        name: "Olivia Davis",
        date: "Oct 03 | 1:15 PM",
        service: "Serene Styles",
        avatar: "/placeholder-user-1.jpg",
        eta: "em 23 horas"
    },
    {
        name: "Alice Thompson",
        date: "Oct 07 | 10:00 AM",
        service: "Glamour Cuts",
        avatar: "/placeholder-user-2.jpg",
        eta: "em 4 dias"
    },
    {
        name: "William Turner",
        date: "Oct 08 | 9:15 AM",
        service: "Glamour Cuts",
        avatar: "/placeholder-user-3.jpg",
        eta: "em 5 dias"
    }
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {label}
            </span>
            <span className="font-bold text-accent">
              {`€${payload[0].value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};


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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita / Agendamentos</CardTitle>
             <CardDescription>
              Visão geral da receita nos últimos 30 dias.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pl-2">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{
                  top: 5,
                  right: 20,
                  left: -10,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value/1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 2, strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Próximos Agendamentos</CardTitle>
                <Button variant="link" size="sm" asChild>
                    <Link href="/admin/bookings">Ver todos</Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {upcomingAppointments.map((appt, index) => (
                     <Link href="#" key={index} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={appt.avatar} />
                            <AvatarFallback>{appt.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <p className="font-semibold text-sm">{appt.name}</p>
                            <p className="text-xs text-muted-foreground">{appt.date}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{appt.eta}</span>
                            <ChevronRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
