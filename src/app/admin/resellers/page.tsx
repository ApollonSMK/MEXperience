'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Store, DollarSign, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Usaremos um fetch direto aqui por simplicidade, ou poderíamos criar uma server action separada
export default function AdminResellersPage() {
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();
    const [loading, setLoading] = useState(true);
    const [resellers, setResellers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [globalStats, setGlobalStats] = useState({
        totalSales: 0,
        totalCommission: 0,
        activeResellers: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            // 1. Buscar perfis que são revendedores
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email, photo_url, reseller_commission, last_sign_in_at')
                .eq('is_reseller', true);

            if (error) {
                console.error(error);
                setLoading(false);
                return;
            }

            // 2. Buscar vendas (gift cards) desses revendedores
            // Nota: Para escalar, faríamos isso via SQL join ou RPC, mas para <100 revendedores isso funciona bem no client
            const resellerIds = (profiles || []).map((p: any) => p.id);
            let salesMap: Record<string, { total: number, count: number }> = {};
            
            if (resellerIds.length > 0) {
                const { data: sales } = await supabase
                    .from('gift_cards')
                    .select('buyer_id, initial_balance')
                    .in('buyer_id', resellerIds);

                sales?.forEach((sale: any) => {
                    if (!salesMap[sale.buyer_id]) {
                        salesMap[sale.buyer_id] = { total: 0, count: 0 };
                    }
                    salesMap[sale.buyer_id].total += sale.initial_balance;
                    salesMap[sale.buyer_id].count += 1;
                });
            }

            // 3. Montar objeto final
            let gTotalSales = 0;
            let gTotalComm = 0;

            const enrichedResellers = (profiles || []).map((p: any) => {
                const stats = salesMap[p.id] || { total: 0, count: 0 };
                const commissionRate = p.reseller_commission || 10; // Default 10%
                const commissionValue = stats.total * (commissionRate / 100);

                gTotalSales += stats.total;
                gTotalComm += commissionValue;

                return {
                    ...p,
                    totalSales: stats.total,
                    salesCount: stats.count,
                    commissionRate,
                    commissionValue
                };
            });

            // Ordernar por Vendas (maior para menor)
            enrichedResellers.sort((a: any, b: any) => b.totalSales - a.totalSales);

            setResellers(enrichedResellers);
            setGlobalStats({
                totalSales: gTotalSales,
                totalCommission: gTotalComm,
                activeResellers: profiles.length
            });
            setLoading(false);
        };

        fetchData();
    }, [supabase]);

    const filteredResellers = resellers.filter(r => 
        r.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getInitials = (first?: string, last?: string) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Gestion des Revendeurs</h1>
                <p className="text-muted-foreground">Suivi des performances et des commissions.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventes Totales (Revendeurs)</CardTitle>
                        <Store className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{globalStats.totalSales.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Volume généré via console revendeur</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Commissions à Payer</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{globalStats.totalCommission.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Valeur estimée basée sur les taux actuels</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revendeurs Actifs</CardTitle>
                        <Users className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{globalStats.activeResellers}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Liste des Revendeurs</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Rechercher..." 
                                className="pl-8" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Revendeur</TableHead>
                                <TableHead>Taux Com.</TableHead>
                                <TableHead className="text-right">Ventes</TableHead>
                                <TableHead className="text-right">Cartes</TableHead>
                                <TableHead className="text-right">Gain (Est.)</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">Chargement...</TableCell>
                                </TableRow>
                            ) : filteredResellers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Aucun revendeur trouvé.</TableCell>
                                </TableRow>
                            ) : (
                                filteredResellers.map((reseller) => (
                                    <TableRow key={reseller.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={reseller.photo_url} />
                                                    <AvatarFallback>{getInitials(reseller.first_name, reseller.last_name)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{reseller.first_name} {reseller.last_name}</span>
                                                    <span className="text-xs text-muted-foreground">{reseller.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                {reseller.commissionRate}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            €{reseller.totalSales.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {reseller.salesCount}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600">
                                            €{reseller.commissionValue.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users/${reseller.id}`)}>
                                                Gérer
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}