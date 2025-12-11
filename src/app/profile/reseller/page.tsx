'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift, Store, PlusCircle } from 'lucide-react';

export default function ResellerPage() {
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();
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
                .select('is_reseller')
                .eq('id', user.id)
                .single();

            if (!profile?.is_reseller) {
                router.push('/profile');
                return;
            }
            setLoading(false);
        };

        fetchProfile();
    }, [router, supabase]);

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
                        <Card className="border-emerald-200 bg-emerald-50/30 dark:bg-emerald-900/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Store className="h-5 w-5 text-emerald-600" />
                                    Espace Revendeur
                                </CardTitle>
                                <CardDescription>
                                    Vendez des cartes cadeaux directement à vos clients.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button 
                                    size="lg" 
                                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => router.push('/cadeaux?mode=reseller')} // Futuramente podemos customizar a página de presentes
                                >
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Vendre une nouvelle Carte Cadeau
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Historique des ventes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    Aucune vente récente.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}