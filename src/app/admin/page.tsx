'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, Euro, Calendar, Users } from 'lucide-react';


const chartData = [
  { month: 'Janeiro', revenue: 1860 },
  { month: 'Fevereiro', revenue: 2050 },
  { month: 'Março', revenue: 2370 },
  { month: 'Abril', revenue: 1980 },
  { month: 'Maio', revenue: 2540 },
  { month: 'Junho', revenue: 2890 },
];

const chartConfig = {
  revenue: {
    label: 'Receita',
    color: 'hsl(var(--primary))',
  },
};

const recentAppointments = [
  {
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    avatar: '/avatars/01.png',
    service: 'Hydromassage',
    status: 'Confirmado',
    date: '25/07/2024 14:30',
  },
  {
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    avatar: '/avatars/02.png',
    service: 'Collagen Boost',
    status: 'Confirmado',
    date: '25/07/2024 16:00',
  },
  {
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    avatar: '/avatars/03.png',
    service: 'Dôme Infrarouge',
    status: 'Pendente',
    date: '26/07/2024 11:00',
  },
  {
    name: 'William Kim',
    email: 'will@email.com',
    avatar: '/avatars/04.png',
    service: 'Banc Solaire',
    status: 'Cancelado',
    date: '26/07/2024 15:15',
  },
  {
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    avatar: '/avatars/05.png',
    service: 'Hydromassage',
    status: 'Confirmado',
    date: '27/07/2024 09:45',
  },
];


export default function AdminDashboardPage() {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% em relação ao mês passado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">+180.1% em relação ao mês passado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-xs text-muted-foreground">+19% em relação ao mês passado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelamentos</CardTitle>
             <ArrowUp className="h-4 w-4 text-muted-foreground rotate-45 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">+201 desde a última hora</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral da Receita</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Agendamentos Recentes</CardTitle>
            <CardDescription>Houve 26 agendamentos este mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAppointments.map((appointment) => (
                  <TableRow key={appointment.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                           <AvatarImage src={appointment.avatar} alt={appointment.name} />
                          <AvatarFallback>{getInitials(appointment.name)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                          <p className="font-medium">{appointment.name}</p>
                          <p className="text-xs text-muted-foreground">{appointment.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{appointment.service}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          appointment.status === 'Confirmado'
                            ? 'default'
                            : appointment.status === 'Pendente'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="capitalize"
                      >
                        {appointment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
