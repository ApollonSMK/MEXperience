
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { DollarSign, Users, Calendar, Activity, ChevronRight } from 'lucide-react';
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
import type { Booking } from '@/types/booking';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';

const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {label}
            </span>
            <span className="font-bold text-accent">
              {`${value} ${value === 1 ? 'agendamento' : 'agendamentos'}`}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardClientProps {
    stats: {
        totalUsers: number;
        totalBookings: number;
    };
    upcomingBookings: Booking[];
    chartData: { date: string; bookings: number }[];
}


export function DashboardClient({ stats, upcomingBookings, chartData }: DashboardClientProps) {
  const staticStats = [
    {
      title: 'Receita Total (Exemplo)',
      value: '€4,231.89',
      change: '+20.1% do último mês',
      icon: DollarSign,
    },
    {
        title: 'Total de Utilizadores',
        value: stats.totalUsers,
        change: 'Clientes registados na plataforma.',
        icon: Users,
    },
    {
        title: 'Total de Agendamentos',
        value: stats.totalBookings,
        change: 'Sessões confirmadas até hoje.',
        icon: Calendar,
    },
    {
      title: 'Atividade (Exemplo)',
      value: '+573',
      change: '+201 desde a última hora',
      icon: Activity,
    },
  ];

  const [timeToNowMap, setTimeToNowMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const newTimeToNowMap: Record<number, string> = {};
    upcomingBookings.forEach(appt => {
      try {
        const dateTimeString = `${appt.date}T${appt.time}`;
        const eventDate = new Date(dateTimeString);
        newTimeToNowMap[appt.id] = formatDistanceToNow(eventDate, { locale: ptBR, addSuffix: true });
      } catch (e) {
        newTimeToNowMap[appt.id] = 'data inválida';
      }
    });
    setTimeToNowMap(newTimeToNowMap);
  }, [upcomingBookings]);

  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {staticStats.map((stat) => (
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
            <CardTitle>Agendamentos Confirmados</CardTitle>
             <CardDescription>
              Visão geral dos agendamentos confirmados nos últimos 14 dias.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pl-2">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 20,
                  left: -10,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 2, strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
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
                {upcomingBookings.length > 0 ? (
                    upcomingBookings.map((appt) => (
                        <Link href={`/admin/users/${appt.user_id}`} key={appt.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={appt.avatar_url || ''} />
                                <AvatarFallback>{getInitials(appt.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <p className="font-semibold text-sm">{appt.name}</p>
                                <p className="text-xs text-muted-foreground">{appt.date} | {appt.time.substring(0,5)}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{timeToNowMap[appt.id] || 'a calcular...'}</span>
                                <ChevronRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-10">
                        <p className="text-sm text-muted-foreground">Não há próximos agendamentos.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
