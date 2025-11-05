'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ArrowLeft, Gift, Copy, Check, Ticket, User, Calendar, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { User as AuthUser } from '@supabase/supabase-js';

// Types
interface UserProfile {
    id: string;
    plan_id?: string;
    display_name?: string;
    photo_url?: string;
}
interface Plan {
    id: string;
    title: string;
    benefits: {
        guestPasses?: {
            quantity: number;
            period: 'week' | 'month';
        };
    };
}
interface GuestPass {
    id: string;
    created_at: string;
    guest_user_id: string;
    guest_profile?: {
        display_name: string;
        photo_url: string;
    };
}

const getInitials = (name?: string) => name ? name.split(' ').map((n) => n[0]).join('') : 'U';

export default function GuestPassesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [usedPasses, setUsedPasses] = useState<GuestPass[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [hasCopied, setHasCopied] = useState(false);

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user || null;
            setUser(currentUser);
            if (!currentUser) {
                router.push('/login');
            }
        });

        return () => authListener.subscription.unsubscribe();
    }, [router, supabase]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            
            try {
                // Fetch profile first
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, plan_id')
                    .eq('id', user.id)
                    .single();

                if (profileError) throw new Error("Impossible de charger votre profil.");
                setUserData(profile);
                
                let currentPlan: Plan | null = null;
                if (profile.plan_id) {
                    const { data: planData, error: planError } = await supabase
                        .from('plans')
                        .select('id, title, benefits')
                        .eq('id', profile.plan_id)
                        .single();
                    if (planError) throw new Error("Impossible de charger votre abonnement.");
                    setPlan(planData);
                    currentPlan = planData;
                } else {
                    setPlan(null);
                }

                const passBenefit = currentPlan?.benefits?.guestPasses;
                if (passBenefit) {
                    const now = new Date();
                    const rangeStart = passBenefit.period === 'week' ? startOfWeek(now, { locale: fr }) : startOfMonth(now);
                    const { data: passesData, error: passesError } = await supabase
                        .from('guest_passes')
                        .select('id, created_at, guest_user_id, guest_profile:profiles(display_name, photo_url)')
                        .eq('host_user_id', user.id)
                        .gte('created_at', rangeStart.toISOString());
                    
                    if (passesError) throw new Error("Impossible de charger vos invitations utilisées.");
                    setUsedPasses(passesData as GuestPass[] || []);
                } else {
                    setUsedPasses([]);
                }
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Erreur', description: error.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, supabase, toast]);

    const guestPassBenefit = useMemo(() => plan?.benefits?.guestPasses, [plan]);
    const passesUsedThisPeriod = usedPasses.length;
    const passesAvailable = guestPassBenefit ? guestPassBenefit.quantity - passesUsedThisPeriod : 0;

    const generateInviteLink = async () => {
        if (!user || !guestPassBenefit || passesAvailable <= 0) return;

        setIsGeneratingLink(true);
        setInviteLink('');
        try {
            const payload = {
                host_id: user.id,
                plan_id: plan?.id,
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expires in 24 hours
            };
            const token = btoa(JSON.stringify(payload));
            
            const origin = window.location.origin;
            const link = `${origin}/guest-invite/${token}`;
            setInviteLink(link);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer le lien.' });
        } finally {
            setIsGeneratingLink(false);
        }
    };
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setHasCopied(true);
        toast({ title: 'Copié !', description: 'Le lien d’invitation a été copié dans votre presse-papiers.' });
        setTimeout(() => setHasCopied(false), 2000);
    };

    if (isLoading || !user) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto max-w-4xl px-4 py-8 space-y-8">
                    <Skeleton className="h-8 w-40 mb-6" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                </main>
                <Footer />
            </div>
        );
    }
    
    return (
        <>
            <Header />
            <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-background">
                <div className="container mx-auto max-w-4xl px-4 py-8">
                    <div className="mb-6">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour au Profil
                        </Button>
                    </div>

                    <div className="grid gap-8">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Ticket className="h-6 w-6" />
                                    <span>Mes Invitations</span>
                                </CardTitle>
                                <CardDescription>
                                    Invitez un ami ou un membre de votre famille à profiter d'une séance.
                                    {guestPassBenefit ? ` Vous avez droit à ${guestPassBenefit.quantity} invitation(s) par ${guestPassBenefit.period === 'week' ? 'semaine' : 'mois'}.` : ""}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {guestPassBenefit && guestPassBenefit.quantity > 0 ? (
                                    <>
                                        <div className="flex flex-col sm:flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="text-center sm:text-left">
                                                <p className="text-sm text-muted-foreground">Invitations Disponibles</p>
                                                <p className="text-4xl font-bold">{passesAvailable}</p>
                                            </div>
                                            <Button 
                                                onClick={generateInviteLink} 
                                                disabled={passesAvailable <= 0 || isGeneratingLink}
                                                className="w-full mt-4 sm:mt-0 sm:w-auto"
                                            >
                                                {isGeneratingLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Générer un lien d'invitation
                                            </Button>
                                        </div>

                                        {inviteLink && (
                                            <div className="flex items-center space-x-2 rounded-lg bg-muted p-4">
                                                <Gift className="h-5 w-5 text-primary" />
                                                <input
                                                    type="text"
                                                    value={inviteLink}
                                                    readOnly
                                                    className="flex-grow bg-transparent text-sm outline-none"
                                                />
                                                <Button size="icon" onClick={copyToClipboard} variant="ghost">
                                                    {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                                        <Info className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <p className="mt-2">Votre abonnement actuel n'inclut pas d'invitations pour des invités.</p>
                                        <Button variant="link" onClick={() => router.push('/#pricing')}>Voir les abonnements</Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Historique des Invitations</CardTitle>
                                <CardDescription>
                                    Liste des invitations que vous avez utilisées {guestPassBenefit?.period === 'week' ? 'cette semaine' : 'ce mois-ci'}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invité</TableHead>
                                            <TableHead>Date d'utilisation</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usedPasses.length > 0 ? (
                                            usedPasses.map(pass => (
                                                <TableRow key={pass.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarImage src={pass.guest_profile?.photo_url} />
                                                                <AvatarFallback>{getInitials(pass.guest_profile?.display_name)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium">{pass.guest_profile?.display_name || 'Invité'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {format(new Date(pass.created_at), 'd MMMM, yyyy', { locale: fr })}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center h-24">
                                                    Aucune invitation utilisée pendant cette période.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
