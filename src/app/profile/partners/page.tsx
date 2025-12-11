'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ArrowLeft, TrendingUp, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PartnerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    const [referralCode, setReferralCode] = useState<string>('');
    const [loading, setLoading] = useState(true);

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

            setReferralCode(profile.referral_code || 'PENDING');
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
                        <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-900/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                    Espace Partenaire
                                </CardTitle>
                                <CardDescription>
                                    Partagez votre lien unique. Lorsqu'un nouvel utilisateur s'inscrit via ce lien, vous gagnez des récompenses.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm font-medium">Votre lien de parrainage</label>
                                    <div className="flex space-x-2">
                                        <Input value={referralLink} readOnly className="font-mono bg-white" />
                                        <Button onClick={copyToClipboard} className="bg-purple-600 hover:bg-purple-700">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Estatísticas Placeholder */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Parrainés</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">0</div>
                                    <p className="text-xs text-muted-foreground">Utilisateurs inscrits</p>
                                </CardContent>
                            </Card>
                            {/* Adicionar mais stats futuramente */}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}