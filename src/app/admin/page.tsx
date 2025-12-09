'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
    Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Euro, Calendar, Users, TrendingUp, Activity, CreditCard, Clock, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';

// --- Interfaces ---
interface Appointment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  service_name: string;
  date: string;
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
  payment_method: 'card' | 'minutes' | 'reception';
}

interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: string;
    plan_title?: string;
}

// --- Configurações de Gráficos ---
const chartConfig = {
  revenue: { label: 'Revenu (€)', color: 'hsl(var(--primary))' },
  appointments: { label: 'Rendez-vous', color: 'hsl(var(--secondary))' },
};

// --- Utilitários ---
const getInitials = (name?: string) => name ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

// --- Componente Principal ---
export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();
  
  const today = useMemo(() => new Date(), []);
  const thirtyDaysAgo = useMemo(() => startOfDay(subDays(today, 30)), [today]);
  
  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    if (!supabase) return;
    if (isLoading) {
        const { data: invData, error: invError } = await supabase.from('invoices').select('*').order('date', { ascending: false });
        const { data: appData, error: appError } = await supabase.from('appointments').select('*').order('date', { ascending: false });

        if (!invError) setInvoices(invData as Invoice[] || []);
        if (!appError) setAppointments(appData as Appointment[] || []);
        setIsLoading(false);
    }
  }, [supabase, isLoading]);

  useEffect(() => {
    const initialize = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            await fetchData();
        } else {
           setIsLoading(false);
        }
    }
    initialize();

    // Realtime Subscriptions
    const appChannel = supabase.channel('admin-dash-app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchData()) // Simplificado para refetch por segurança
      .subscribe();
      
    const invChannel = supabase.channel('admin-dash-inv')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(appChannel);
      supabase.removeChannel(invChannel);
    };
  }, [fetchData, supabase]);

  // --- Cálculos e Estatísticas ---

  // 1. Gráfico Principal (Área) - Últimos 30 dias
  const revenueChartData = useMemo(() => {
    const interval = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    return interval.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dailyInvoices = invoices.filter(inv => format(new Date(inv.date), 'yyyy-MM-dd') === dayStr);
        const dailyApps = appointments.filter(app => format(new Date(app.date), 'yyyy-MM-dd') === dayStr && app.status !== 'Cancelado');
        
        return {
            date: format(day, 'dd/MM'),
            fullDate: format(day, 'd MMMM', { locale: fr }),
            revenue: dailyInvoices.reduce((acc, curr) => acc + curr.amount, 0),
            appointments: dailyApps.length,
        };
    });
  }, [invoices, appointments, thirtyDaysAgo, today]);

  // 2. Estatísticas de KPI (Cards do Topo)
  const stats = useMemo(() => {
    const currentMonthStart = startOfMonth(today);
    const prevMonthStart = startOfMonth(subMonths(today, 1));
    const prevMonthEnd = endOfMonth(subMonths(today, 1));

    // Receita Mensal
    const currentMonthRevenue = invoices
        .filter(i => new Date(i.date) >= currentMonthStart)
        .reduce((acc, curr) => acc + curr.amount, 0);
        
    const prevMonthRevenue = invoices
        .filter(i => isWithinInterval(new Date(i.date), { start: prevMonthStart, end: prevMonthEnd }))
        .reduce((acc, curr) => acc + curr.amount, 0);
    
    const revenueGrowth = prevMonthRevenue > 0 ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 100;

    // Total Agendamentos (Mês Atual)
    const currentMonthApps = appointments.filter(a => new Date(a.date) >= currentMonthStart && a.status !== 'Cancelado').length;
    
    // Valor Pendente (Estimativa baseada em agendamentos futuros não pagos - simplificado)
    // Vamos considerar "Minutes Balance" consumido este mês
    const minutesConsumed = appointments
        .filter(a => new Date(a.date) >= currentMonthStart && a.status === 'Concluído')
        .reduce((acc, curr) => acc + curr.duration, 0);

    return {
        revenue: currentMonthRevenue,
        revenueGrowth,
        appointments: currentMonthApps,
        minutesConsumed,
        totalClients: new Set(appointments.map(a => a.user_email)).size
    };
  }, [invoices, appointments, today]);

  // 3. Serviços Mais Populares (Bar Chart)
  const topServices = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(app => {
        if (app.status !== 'Cancelado') {
            const name = app.service_name || 'Outros';
            counts[name] = (counts[name] || 0) + 1;
        }
    });
    return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
  }, [appointments]);

  // 4. Métodos de Pagamento (Pie Chart)
  const paymentMethods = useMemo(() => {
    const methods = { card: 0, minutes: 0, reception: 0 };
    appointments.forEach(app => {
        if (app.status !== 'Cancelado' && app.payment_method) {
            methods[app.payment_method] = (methods[app.payment_method] || 0) + 1;
        }
    });
    return [
        { name: 'Carte Bancaire', value: methods.card, fill: 'hsl(var(--chart-1))' },
        { name: 'Compte Minutes', value: methods.minutes, fill: 'hsl(var(--chart-2))' },
        { name: 'Réception', value: methods.reception, fill: 'hsl(var(--chart-3))' },
    ].filter(i => i.value > 0);
  }, [appointments]);

  // 5. Transações Recentes
  const recentTransactions = useMemo(() => invoices.slice(0, 5), [invoices]);

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 p-1 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
            <p className="text-muted-foreground">Vue d'ensemble de vos performances et activités.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg">
            <Badge variant="outline" className="bg-background shadow-sm"><Calendar className="w-3 h-3 mr-2"/> {format(today, 'MMMM yyyy', { locale: fr })}</Badge>
        </div>
      </div>

      {/* --- KPI CARDS (Bento Top Row) --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
            title="Revenu Mensuel" 
            value={`€${stats.revenue.toFixed(2)}`} 
            subtext={`${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth.toFixed(1)}% par rapport au mois dernier`}
            icon={Euro}
            trend={stats.revenueGrowth >= 0 ? 'up' : 'down'}
        />
        <KpiCard 
            title="Rendez-vous" 
            value={stats.appointments.toString()} 
            subtext="Ce mois-ci"
            icon={Calendar}
        />
        <KpiCard 
            title="Minutes Consommées" 
            value={`${stats.minutesConsumed} min`} 
            subtext="Utilisation des forfaits"
            icon={Clock}
        />
        <KpiCard 
            title="Clients Actifs" 
            value={stats.totalClients.toString()} 
            subtext="Clients uniques totaux"
            icon={Users}
        />
      </div>

      {/* --- MAIN CONTENT GRID (Bento Style) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* Left Column (Charts) - Spans 4 */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Main Revenue Chart */}
            <Card className="col-span-4 border-none shadow-md bg-gradient-to-br from-background to-secondary/10">
                <CardHeader>
                    <CardTitle>Revenus & Activité</CardTitle>
                    <CardDescription>Évolution sur les 30 derniers jours</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <AreaChart data={revenueChartData}>
                             <defs>
                                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="fillApps" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-appointments)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--color-appointments)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis 
                                dataKey="date" 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={8} 
                                fontSize={12}
                            />
                            <YAxis 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => `€${value}`} 
                                fontSize={12}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area 
                                dataKey="revenue" 
                                type="monotone" 
                                fill="url(#fillRevenue)" 
                                stroke="var(--color-revenue)" 
                                strokeWidth={2} 
                            />
                            <Area 
                                dataKey="appointments" 
                                type="monotone" 
                                fill="url(#fillApps)" 
                                stroke="var(--color-appointments)" 
                                strokeWidth={2} 
                            />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Top Services Bar Chart */}
                 <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Top Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topServices} layout="vertical" margin={{ left: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} interval={0} />
                                    <Tooltip 
                                        contentStyle={{ background: 'hsl(var(--popover))', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        cursor={{fill: 'transparent'}}
                                    />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                 </Card>

                 {/* Payment Methods Pie Chart */}
                 <Card className="border-none shadow-md flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg">Paiements</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[200px] flex items-center justify-center">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                         </ResponsiveContainer>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-xs text-muted-foreground pt-0">
                        {paymentMethods.map((m, i) => (
                            <div key={i} className="flex items-center gap-2 w-full">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: m.fill}} />
                                <span className="flex-1">{m.name}</span>
                                <span className="font-mono font-bold">{m.value}</span>
                            </div>
                        ))}
                    </CardFooter>
                 </Card>
            </div>

        </div>

        {/* Right Column (Lists/Tables) - Spans 3 */}
        <div className="lg:col-span-3 space-y-6">
            
            {/* Recent Transactions */}
            <Card className="h-full border-none shadow-md flex flex-col">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Dernières Transactions</CardTitle>
                        <Badge variant="secondary" className="text-xs cursor-pointer">Voir tout</Badge>
                    </div>
                    <CardDescription>Les 5 dernières factures générées.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                    <div className="space-y-6">
                        {recentTransactions.length > 0 ? recentTransactions.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{inv.plan_title || 'Service / Produit'}</span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(inv.date), "d MMM, HH:mm", {locale: fr})}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-sm">€{inv.amount.toFixed(2)}</div>
                                    <Badge variant={inv.status === 'paid' ? 'outline' : 'destructive'} className="text-[10px] h-5 px-1.5">
                                        {inv.status === 'paid' ? 'Payé' : inv.status}
                                    </Badge>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-muted-foreground">Aucune transaction récente.</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Mini List */}
             <Card className="border-none shadow-md bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        En Direct
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold mb-2">
                        {appointments.filter(a => isSameDay(new Date(a.date), today) && a.status === 'Confirmado').length}
                    </div>
                    <p className="text-primary-foreground/80 text-sm">Rendez-vous confirmés pour aujourd'hui.</p>
                </CardContent>
            </Card>

        </div>

      </div>
    </div>
  );
}

// --- Subcomponent: KPI Card ---
function KpiCard({ title, value, subtext, icon: Icon, trend }: { title: string, value: string, subtext: string, icon: any, trend?: 'up' | 'down' }) {
    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center mt-1">
                    {trend && (
                        trend === 'up' ? 
                        <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" /> : 
                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <p className={cn("text-xs", trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground')}>
                        {subtext}
                    </p>
                </div>
            </CardContent>
            {/* Decorative background blob */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        </Card>
    );
}