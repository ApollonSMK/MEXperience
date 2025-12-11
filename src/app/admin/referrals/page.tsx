'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
    Search, Loader2, Copy, ExternalLink, TrendingUp, Users, Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Influencer {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_url: string;
    referral_code: string;
    created_at: string;
    referral_count?: number;
}

export default function AdminReferralsPage() {
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [influencers, setInfluencers] = useState<Influencer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            try {
                // 1. Buscar influenciadores
                // Changed to select('*') to avoid errors if specific columns are cached/missing
                const { data: allProfiles, error } = await supabase
                    .from('profiles')
                    .select('*');

                if (error) {
                    console.error("Supabase Error details:", JSON.stringify(error, null, 2));
                    throw error;
                }

                // Filter client-side temporarily
                const profiles = (allProfiles || []).filter((p: any) => p.is_influencer === true);

                // 2. Tentar buscar contagem de referências
                // Query para contar quantos users têm referred_by = referral_code
                const enhancedProfiles = await Promise.all(
                    profiles.map(async (p: any) => {
                        let count = 0;
                        if (p.referral_code) {
                            try {
                                const { count: usageCount } = await supabase
                                    .from('profiles')
                                    .select('*', { count: 'exact', head: true })
                                    .eq('referred_by', p.referral_code);
                                count = usageCount || 0;
                            } catch (e) {
                                console.warn("Could not count referrals", e);
                            }
                        }
                        return { ...p, referral_count: count };
                    })
                );

                setInfluencers(enhancedProfiles as Influencer[]);
            } catch (err: any) {
                console.error("Erro catch:", err);
                toast({ 
                    variant: "destructive", 
                    title: "Erreur", 
                    description: "Impossible de charger les données. Vérifiez la console." 
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [supabase, toast]);

    const filteredInfluencers = influencers.filter(inf => 
        inf.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copié", description: "Code copié dans le presse-papier." });
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Parrainage & Influenceurs</h1>
                <p className="text-muted-foreground">Gérez les partenaires et suivez l'utilisation des codes.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Partenaires Actifs</CardTitle>
                        <Share2 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{influencers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nouveaux Clients Référés</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {influencers.reduce((acc, curr) => acc + (curr.referral_count || 0), 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">via codes promo</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Liste des Influenceurs</CardTitle>
                            <CardDescription>Utilisateurs avec statut d'influenceur actif.</CardDescription>
                        </div>
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
                                <TableHead>Partenaire</TableHead>
                                <TableHead>Code Promo</TableHead>
                                <TableHead>Clients Apportés</TableHead>
                                <TableHead>Date d'ajout</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInfluencers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        Aucun influenceur trouvé.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInfluencers.map((inf) => (
                                    <TableRow key={inf.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={inf.photo_url} />
                                                    <AvatarFallback>{inf.first_name?.[0]}{inf.last_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{inf.first_name} {inf.last_name}</div>
                                                    <div className="text-xs text-muted-foreground">{inf.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {inf.referral_code ? (
                                                <Badge variant="outline" className="font-mono flex items-center gap-1 w-fit bg-purple-50 text-purple-700 border-purple-200">
                                                    {inf.referral_code}
                                                    <Copy 
                                                        className="h-3 w-3 cursor-pointer ml-1 hover:text-purple-900" 
                                                        onClick={() => copyToClipboard(inf.referral_code)}
                                                    />
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{inf.referral_count}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {inf.created_at ? format(new Date(inf.created_at), 'dd/MM/yyyy', { locale: fr }) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users/${inf.id}`)}>
                                                <ExternalLink className="h-4 w-4" />
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