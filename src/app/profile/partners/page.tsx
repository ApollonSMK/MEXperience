'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ArrowLeft, TrendingUp, Users, BadgeCheck, Zap, MousePointerClick, Network } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPartnerStats } from '@/app/actions/partners';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ReferralTreeNode } from '@/components/referral-tree-node';

export default function PartnerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [referralCode, setReferralCode] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({
        totalReferred: 0,
        activeSubs: 0,
        clicks: 0,
        minutesEarned: 0,
        chartData: [],
        tree: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getPartnerStats();
                setReferralCode(res.code || '');
                setData({
                    totalReferred: res.totalReferred,
                    activeSubs: res.activeSubs,
                    clicks: res.clicks,
                    minutesEarned: res.totalMinutesEarned,
                    chartData: res.chartData,
                    tree: res.tree
                });
            } catch (error) {
                console.error('Error fetching partner stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const referralLink = typeof window !== 'undefined' 
        ? `${window.location.origin}/signup?ref=${referralCode}`
        : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        toast({ title: "Copiado!", description: "Link de afiliado copiado para a área de transferência." });
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-purple-600 rounded-full animate-bounce mb-4"></div>
                <p className="text-muted-foreground">A carregar o teu império...</p>
            </div>
        </div>
    );

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50/50 dark:bg-zinc-900/50 py-10">
                <div className="container mx-auto max-w-6xl px-4 space-y-6">
                    <Button variant="ghost" onClick={() => router.push('/profile')} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Perfil
                    </Button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Painel de Parceiro</h1>
                            <p className="text-muted-foreground">
                                Gere a tua rede, acompanha estatísticas e visualiza os teus ganhos.
                            </p>
                        </div>
                        <Card className="bg-purple-600 text-white border-none shadow-lg">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-full">
                                    <Zap className="h-6 w-6 text-yellow-300" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-purple-100">Ganhos Totais</p>
                                    <p className="text-2xl font-bold">{data.minutesEarned} min</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                            <TabsTrigger value="network">Minha Rede (Árvore)</TabsTrigger>
                        </TabsList>

                        {/* TAB: OVERVIEW */}
                        <TabsContent value="overview" className="space-y-6">
                            {/* Link Card */}
                            <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-900/10">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-purple-600" />
                                        O Teu Link Único
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2">
                                        <Input value={referralLink} readOnly className="font-mono bg-white dark:bg-zinc-950 border-purple-100" />
                                        <Button onClick={copyToClipboard} className="bg-purple-600 hover:bg-purple-700">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Partilha este link. Ganhas 10% em minutos sobre todos os pagamentos da tua rede.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Stats Grid */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Cliques no Link</CardTitle>
                                        <MousePointerClick className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{data.clicks}</div>
                                        <p className="text-xs text-muted-foreground">Total de visitas únicas</p>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Registos</CardTitle>
                                        <Users className="h-4 w-4 text-green-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{data.totalReferred}</div>
                                        <p className="text-xs text-muted-foreground">Novos utilizadores</p>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Conversão</CardTitle>
                                        <BadgeCheck className="h-4 w-4 text-purple-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {data.clicks > 0 ? ((data.totalReferred / data.clicks) * 100).toFixed(1) : 0}%
                                        </div>
                                        <p className="text-xs text-muted-foreground">Taxa de registo por clique</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Chart */}
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Crescimento da Rede (30 Dias)</CardTitle>
                                    <CardDescription>Novos registos diários através do teu link.</CardDescription>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis 
                                                    dataKey="date" 
                                                    tickLine={false} 
                                                    axisLine={false} 
                                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    tickLine={false} 
                                                    axisLine={false} 
                                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                                />
                                                <Tooltip 
                                                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Bar 
                                                    dataKey="signups" 
                                                    fill="hsl(var(--primary))" 
                                                    radius={[4, 4, 0, 0]} 
                                                    maxBarSize={50}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB: NETWORK TREE */}
                        <TabsContent value="network" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Network className="h-5 w-5 text-purple-600" />
                                        Árvore de Afiliados
                                    </CardTitle>
                                    <CardDescription>
                                        Visualiza a tua rede em profundidade. Clica nas setas para expandir os níveis.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-slate-50 dark:bg-zinc-950/50 p-6 rounded-lg min-h-[400px] overflow-auto border">
                                        {data.tree.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                                                <Users className="h-10 w-10 mb-2 opacity-20" />
                                                <p>Ainda não tens afiliados.</p>
                                                <p className="text-sm">Partilha o teu link para começares a construir a tua árvore!</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {data.tree.map((node: any) => (
                                                    <ReferralTreeNode key={node.id} node={node} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
            <Footer />
        </>
    );
}