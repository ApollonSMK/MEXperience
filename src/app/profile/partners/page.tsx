'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ArrowLeft, TrendingUp, Users, BadgeCheck, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PartnerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    const [referralCode, setReferralCode] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalReferred: 0,
        activeSubs: 0
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('referral_code, is_influencer')
                .eq('id', user.id)
                .single();

            if (!profile?.is_influencer) {
                router.push('/profile');
                return;
            }

            const code = profile.referral_code || 'PENDING';
            setReferralCode(code);

            // Fetch Stats if code exists
            if (code && code !== 'PENDING') {
                const { count: totalCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('referred_by', code);

                const { count: activeCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('referred_by', code)
                    .eq('subscription_status', 'active');

                setStats({
                    totalReferred: totalCount || 0,
                    activeSubs: activeCount || 0
                });
            }

            setLoading(false);
        };

        fetchProfile();
    }, [router, supabase]);

    const referralLink = typeof window !== 'undefined' 
        ? `${window.location.origin}/signup?ref=${referralCode}`
        : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        toast({ title: "Copié !", description: "Lien de parrainage copié dans le presse-papier." });
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50/50 dark:bg-zinc-900/50 py-10">
                <div className="container mx-auto max-w-4xl px-4 space-y-6">
                    <Button variant="ghost" onClick={() => router.push('/profile')} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour au profil
                    </Button>

                    <div className="grid gap-6">
                        {/* Header Section */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">Espace Partenaire</h1>
                            <p className="text-muted-foreground">
                                Suivez vos parrainages et vos gains. Vous gagnez des minutes à chaque renouvellement.
                            </p>
                        </div>

                        <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-900/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                    Votre lien unique
                                </CardTitle>
                                <CardDescription>
                                    Partagez ce lien. Lorsqu'un utilisateur s'inscrit et s'abonne, vous êtes récompensé.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex space-x-2">
                                        <Input value={referralLink} readOnly className="font-mono bg-white dark:bg-zinc-950" />
                                        <Button onClick={copyToClipboard} className="bg-purple-600 hover:bg-purple-700">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Grid */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Inscrits</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalReferred}</div>
                                    <p className="text-xs text-muted-foreground">Utilisateurs enregistrés via votre lien</p>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
                                    <BadgeCheck className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.activeSubs}</div>
                                    <p className="text-xs text-muted-foreground">Génèrent des minutes mensuellement</p>
                                </CardContent>
                            </Card>

                             <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-zinc-900 border-indigo-100 dark:border-indigo-900">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Vos Récompenses</CardTitle>
                                    <Zap className="h-4 w-4 text-indigo-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">10%</div>
                                    <p className="text-xs text-indigo-600/80 dark:text-indigo-400/70">De bonus en minutes à chaque paiement</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}