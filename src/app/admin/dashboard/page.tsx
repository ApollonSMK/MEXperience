
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Users,
  Calendar,
  DollarSign,
  BarChart,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DataTable } from '@/components/admin/data-table';
import { tasks } from './data/tasks';


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


export default function AdminDashboardPage() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>

      <div className="flex flex-1 flex-col gap-4 rounded-lg md:gap-8">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {kpiData.map((kpi) => (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
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

        <DataTable data={tasks} />
        
      </div>
    </>
  );
}
