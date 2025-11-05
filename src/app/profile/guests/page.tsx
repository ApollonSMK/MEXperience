'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ArrowLeft, Gift, Copy, Check, Ticket, User, Calendar, Loader2, Info, Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { User as AuthUser } from '@supabase/supabase-js';
import QRCode from 'qrcode.react';

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
    const qrCodeRef = useRef<HTMLDivElement>(null);

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

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        
        try {
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
                    .select('id, created_at, guest_user_id')
                    .eq('host_user_id', user.id)
                    .gte('created_at', rangeStart.toISOString());
                
                if (passesError) {
                    throw new Error("Impossible de charger vos invitations utilisées.");
                }
                
                const guestIds = passesData.map(p => p.guest_user_id);
                if (guestIds.length > 0) {
                    const { data: guestProfiles, error: guestProfilesError } = await supabase
                        .from('profiles')
                        .select('id, display_name, photo_url')
                        .in('id', guestIds);

                    if (guestProfilesError) {
                        console.error("Could not fetch guest profiles, but continuing...");
                    }
                    
                    const passesWithProfiles = passesData.map(pass => ({
                        ...pass,
                        guest_profile: guestProfiles?.find(p => p.id === pass.guest_user_id) || { display_name: 'Invité', photo_url: '' }
                    }));
                    setUsedPasses(passesWithProfiles || []);
                } else {
                    setUsedPasses([]);
                }

            } else {
                setUsedPasses([]);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, supabase, toast]);


    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

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

    const downloadQRCode = () => {
        const canvas = qrCodeRef.current?.querySelector<HTMLCanvasElement>('canvas');
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = "invitation-qrcode.png";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            toast({ title: 'Téléchargé !', description: 'Le QR code a été sauvegardé.'});
        }
    };

    const shareQRCode = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Invitation M.E Experience',
                    text: `Vous avez été invité(e) à une séance chez M.E Experience !`,
                    url: inviteLink,
                });
                toast({ title: 'Partagé !', description: "L'invitation a été partagée."});
            } catch (error) {
                console.log('Error sharing', error);
                 toast({ variant: 'destructive', title: 'Erreur de partage', description: "La partage a été annulé ou a échoué."});
            }
        } else {
            // Fallback for desktop browsers that don't support Web Share API
            copyToClipboard();
            toast({ title: 'Lien copié !', description: "La fonction de partage n'est pas supportée sur cet appareil. Le lien a été copié."});
        }
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
                                                Générer un QR Code
                                            </Button>
                                        </div>

                                        {inviteLink && (
                                            <div className="flex flex-col items-center gap-4 rounded-lg bg-secondary p-6">
                                                <div ref={qrCodeRef} className="bg-white p-4 rounded-lg">
                                                    <QRCode value={inviteLink} size={192} level="H" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button onClick={downloadQRCode} variant="outline">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Télécharger
                                                    </Button>
                                                    <Button onClick={shareQRCode}>
                                                        <Share2 className="mr-2 h-4 w-4" />
                                                        Partager
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground text-center">Votre invité(e) peut scanner ce code ou vous pouvez le partager. Valide 24 heures.</p>
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
