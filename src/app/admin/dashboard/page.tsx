
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  DollarSign,
  BarChart,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const kpiData = [
  {
    title: 'Receita Mensal',
    value: '€4,250',
    change: '+12.5%',
    icon: DollarSign,
  },
  {
    title: 'Novos Agendamentos',
    value: '132',
    change: '+8.2%',
    icon: Calendar,
  },
  {
    title: 'Novos Utilizadores',
    value: '23',
    change: '+2.1%',
    icon: Users,
  },
  {
    title: 'Taxa de Ocupação',
    value: '78%',
    change: '-1.5%',
    icon: BarChart,
  },
];

const chartData = [
  { month: 'Jan', bookings: 65 },
  { month: 'Fev', bookings: 59 },
  { month: 'Mar', bookings: 80 },
  { month: 'Abr', bookings: 81 },
  { month: 'Mai', bookings: 56 },
  { month: 'Jun', bookings: 55 },
  { month: 'Jul', bookings: 40 },
];

const recentBookings = [
  {
    name: 'Ana Silva',
    email: 'ana.silva@example.com',
    service: 'Collagen Boost',
    status: 'Confirmado',
    date: '2024-08-05',
  },
  {
    name: 'Carlos Mendes',
    email: 'carlos.mendes@example.com',
    service: 'Hydromassage',
    status: 'Pendente',
    date: '2024-08-06',
  },
  {
    name: 'Sofia Pereira',
    email: 'sofia.p@example.com',
    service: 'Solarium',
    status: 'Confirmado',
    date: '2024-08-05',
  },
  {
    name: 'Rui Costa',
    email: 'rui.costa@example.com',
    service: 'Domo de Infravermelho',
    status: 'Cancelado',
    date: '2024-08-04',
  },
  {
    name: 'Joana Martins',
    email: 'joana.m@example.com',
    service: 'Collagen Boost',
    status: 'Pendente',
    date: '2024-08-07',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-16 space-y-8">
      <div className="mb-8">
         <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Hub
          </Link>
        </Button>
        <h1 className="text-3xl font-headline font-bold text-primary">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Visão geral do seu sistema e métricas de performance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p
                className={`text-xs ${
                  kpi.change.startsWith('+')
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {kpi.change} desde o mês passado
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Bookings Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visão Geral dos Agendamentos</CardTitle>
            <CardDescription>
              Número de agendamentos nos últimos meses.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <RechartsBarChart data={chartData}>
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Mês
                              </span>
                              <span className="font-bold text-foreground">
                                {payload[0].payload.month}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Agendamentos
                              </span>
                              <span className="font-bold">
                                {payload[0].value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="bookings"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos Recentes</CardTitle>
            <Button asChild variant="ghost" className="absolute top-4 right-4 h-8">
                <Link href="/admin/bookings">
                    Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentBookings.slice(0, 5).map((booking, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {booking.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.service}
                    </p>
                  </div>
                  <div className="text-right">
                     <Badge
                        variant={
                          booking.status === 'Confirmado'
                            ? 'default'
                            : booking.status === 'Pendente'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className={
                          booking.status === 'Confirmado'
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : booking.status === 'Pendente'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }
                      >
                      {booking.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{booking.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
