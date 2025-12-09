'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    Ticket, Clock, Calendar, CheckCircle, AlertCircle, XCircle, 
    ArrowLeft, PlusCircle, QrCode, Hourglass, Share2, Copy, Plus, 
    Loader2, Ban, History, Download, Trash2, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { QRCodeSVG } from 'qrcode.react';
import { generateInvitation, cancelInvitation } from '@/app/actions/invitations';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---

interface PricingTier {
    duration: number;
    price: number;
}

interface Service {
    id: string;
    name: string;
    pricing_tiers: PricingTier[];
}

// --- COMPONENTS ---

const EmptyState = ({ icon: Icon, title, description, action }: any) => (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
            <Icon className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-xs mb-6 mx-auto">{description}</p>
        {action}
    </div>
);

// Mobile Carousel for Invites
const MobileInviteCarousel = ({ invites, userName, onCopy, onCancel, onShare, onDownload }: any) => {
    return (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
            {invites.map((invite: any) => (
                <div key={invite.id} className="snap-center shrink-0 w-[85vw] max-w-[320px]">
                    <Card className="overflow-hidden border-none shadow-lg bg-white dark:bg-slate-900">
                         {/* Ticket Header Visual */}
                         <div className="bg-primary p-4 text-primary-foreground relative overflow-hidden">
                             <div className="flex justify-between items-start relative z-10">
                                 <div>
                                     <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-2">Pass Invité</Badge>
                                     <h3 className="font-bold text-xl leading-tight">{invite.service_snapshot?.name}</h3>
                                 </div>
                                 <Ticket className="h-8 w-8 text-white/30" />
                             </div>
                             <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                         </div>

                         {/* QR Section */}
                         <div className="bg-white dark:bg-slate-900 p-6 flex flex-col items-center justify-center border-b border-dashed relative">
                             <div className="absolute -left-3 bottom-[-1px] w-6 h-6 bg-background rounded-full z-10" />
                             <div className="absolute -right-3 bottom-[-1px] w-6 h-6 bg-background rounded-full z-10" />
                             
                             <div className="p-2 bg-white rounded-lg shadow-sm border mb-3">
                                <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/admin/scan?code=${invite.id}`} size={140} />
                             </div>
                             <p className="text-xs font-mono text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">#{invite.id.slice(0,8)}</p>
                         </div>

                         {/* Details */}
                         <div className="p-4 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                             <div className="flex justify-between text-sm">
                                 <span className="text-muted-foreground">Durée</span>
                                 <span className="font-semibold">{invite.duration} min</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-muted-foreground">Date</span>
                                 <span className="font-semibold">{format(new Date(invite.created_at), 'd MMM yyyy', { locale: fr })}</span>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-2 mt-4">
                                 <Button variant="outline" size="sm" onClick={() => onShare(invite.id)}>
                                     <Share2 className="mr-2 h-3.5 w-3.5" /> Partager
                                 </Button>
                                 <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onCancel(invite.id)}>
                                     Annuler
                                 </Button>
                             </div>
                         </div>
                    </Card>
                </div>
            ))}
        </div>
    )
}

export default function InvitePage() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    
    // State
    const [invitations, setInvitations] = useState<any[]>([]);
    const [userPlan, setUserPlan] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [usageCount, setUsageCount] = useState(0);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [selectedDuration, setSelectedDuration] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Derived
    const userName = userData?.display_name || 'Moi';
    const userBalance = userData?.minutes_balance || 0;
    const selectedService = services.find(s => s.id === selectedServiceId);
    const hasEnoughBalance = selectedDuration ? userBalance >= parseInt(selectedDuration) : true;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    // Fetch Data
    const fetchData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        // 1. User Profile & Plan
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
            setUserData(profile);
            if (profile.plan_id) {
                const { data: plan } = await supabase.from('plans').select('*').eq('id', profile.plan_id).single();
                setUserPlan(plan);
            }
        }

        // 2. Services
        const { data: servicesData } = await supabase.from('services').select('*').order('name');
        setServices(servicesData || []);

        // 3. Invitations
        const { data: invites } = await supabase
            .from('guest_passes')
            .select('*')
            .eq('host_user_id', user.id)
            .order('created_at', { ascending: false });
        
        const passes = invites || [];
        setInvitations(passes);
        
        // Calculate Usage (Logic depends on plan period, simplified here to total active/used)
        // Ideally we filter by created_at > start_of_period
        setUsageCount(passes.filter((p: any) => p.status !== 'cancelled').length); 
        
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handlers
    const handleGenerate = async () => {
        if (!selectedServiceId || !selectedDuration) return;
        
        setIsGenerating(true);
        const result = await generateInvitation(selectedServiceId, parseInt(selectedDuration));
        setIsGenerating(false);

        if (result.success) {
            toast({ title: "Invitation créée !", description: "Votre pass invité est prêt." });
            setIsDialogOpen(false);
            // Refresh data to show new invite and updated balance
            fetchData();
        } else {
            toast({ variant: "destructive", title: "Erreur", description: result.error });
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Voulez-vous vraiment annuler ce pass ? Les minutes seront remboursées.")) return;
        
        const result = await cancelInvitation(id);
        if (result.success) {
            toast({ title: "Pass annulé", description: "Les minutes ont été recréditées." });
            fetchData();
        } else {
            toast({ variant: "destructive", title: "Erreur", description: result.error });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copié !" });
    };

    const handleShare = async (id: string) => {
        const url = `${origin}/admin/scan?code=${id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Pass Invité M.E Experience',
                    text: `Voici ton pass invité pour M.E Experience !`,
                    url: url
                });
            } catch (err) {
                console.error("Share failed", err);
            }
        } else {
            copyToClipboard(url);
            toast({ title: "Lien copié", description: "Envoyez ce lien à votre ami." });
        }
    };

    const handleDownload = (id: string, view: 'mobile' | 'desktop') => {
        // Logic to download image would go here (using html2canvas etc)
        // For now just toast
        toast({ title: "Téléchargement...", description: "Fonctionnalité bientôt disponible." });
    };

    // Lists
    const activeInvites = invitations.filter(i => i.status === 'active');
    const pastInvites = invitations.filter(i => i.status !== 'active');

    if (isLoading) {
         return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Chargement...</p>
                 </div>
            </div>
        );
    }

    return (
        <>
            <Header />
            <main className="flex min-h-screen flex-col bg-background pb-12">
                
                {/* --- HEADER BANNER (Consistent Layout) --- */}
                <div className="w-full bg-slate-50 dark:bg-slate-900/50 border-b py-8 mb-8">
                    <div className="container mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                             <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 shrink-0 bg-background hover:bg-background/80">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Passes Invité</h1>
                                <p className="text-sm text-muted-foreground">Offrez du bien-être à vos proches.</p>
                            </div>
                        </div>
                        
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="w-full sm:w-auto shadow-md">
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Nouveau Pass
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Créer un Pass Invité</DialogTitle>
                                    <DialogDescription>
                                        Sélectionnez le service et la durée. Un QR Code unique sera généré.
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <div className="grid gap-6 py-4">
                                    <div className="space-y-2">
                                        <Label>Service</Label>
                                        <Select value={selectedServiceId} onValueChange={(val) => { setSelectedServiceId(val); setSelectedDuration(''); }}>
                                            <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
                                            <SelectContent>{services.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Durée de la séance</Label>
                                        <Select value={selectedDuration} onValueChange={setSelectedDuration} disabled={!selectedServiceId}>
                                            <SelectTrigger><SelectValue placeholder="Choisir la durée" /></SelectTrigger>
                                            <SelectContent>
                                                {selectedService?.pricing_tiers.map(tier => (
                                                    <SelectItem key={tier.duration} value={String(tier.duration)} disabled={userBalance < tier.duration} className={userBalance < tier.duration ? 'opacity-50' : ''}>
                                                        {tier.duration} minutes {userBalance < tier.duration && '(Solde insuffisant)'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {!hasEnoughBalance && selectedDuration && (
                                        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium flex items-center">
                                            <Ban className="w-4 h-4 mr-2" /> Solde insuffisant ({userBalance} min disponibles).
                                        </div>
                                    )}
                                     {hasEnoughBalance && selectedDuration && (
                                        <div className="p-3 rounded-md bg-primary/10 text-primary text-sm font-medium flex items-center">
                                            <Clock className="w-4 h-4 mr-2" /> {selectedDuration} min seront déduites de votre solde.
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                                    <Button onClick={handleGenerate} disabled={isGenerating || !selectedServiceId || !selectedDuration || !hasEnoughBalance}>
                                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />} Générer
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="container mx-auto max-w-5xl px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        
                        {/* LEFT COLUMN: Stats / Info */}
                        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                            <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary" />
                                        Votre Solde
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className="text-4xl font-bold text-foreground">{userBalance}</span>
                                        <span className="text-sm text-muted-foreground font-medium">minutes</span>
                                    </div>
                                    <Progress value={Math.min(100, (userBalance / 600) * 100)} className="h-2 mb-4 bg-slate-100" />
                                    
                                    <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm leading-relaxed">
                                        Les passes invités utilisent directement vos minutes disponibles.
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                            <Share2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">Comment ça marche ?</h3>
                                            <p className="text-sm text-slate-300 leading-relaxed">
                                                Générez un QR code et envoyez-le à votre invité. Il pourra l'utiliser à l'accueil pour accéder sans frais.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Invites Lists */}
                        <div className="lg:col-span-2">
                            <Tabs defaultValue="active" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                                    <TabsTrigger value="active" className="rounded-full data-[state=active]:shadow-sm">Actifs ({activeInvites.length})</TabsTrigger>
                                    <TabsTrigger value="history" className="rounded-full data-[state=active]:shadow-sm">Historique</TabsTrigger>
                                </TabsList>

                                <TabsContent value="active" className="space-y-6 mt-0 focus-visible:ring-0">
                                    {activeInvites.length === 0 ? (
                                        <EmptyState 
                                            icon={Ticket} 
                                            title="Aucun pass actif" 
                                            description="Vous n'avez aucun pass en attente d'utilisation." 
                                            action={<Button variant="outline" onClick={() => setIsDialogOpen(true)}>Créer mon premier pass</Button>} 
                                        />
                                    ) : (
                                        <>
                                            {/* MOBILE CAROUSEL */}
                                            <div className="block md:hidden">
                                                <MobileInviteCarousel 
                                                    invites={activeInvites} 
                                                    userName={userName} 
                                                    onCopy={(text: string) => copyToClipboard(text)} 
                                                    onCancel={handleCancel} 
                                                    onShare={handleShare} 
                                                    onDownload={(id: string) => handleDownload(id, 'mobile')} 
                                                />
                                                <div className="flex justify-center mt-2 gap-1.5">
                                                     {activeInvites.map((_, i) => (
                                                        <div key={i} className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                     ))}
                                                </div>
                                            </div>

                                            {/* DESKTOP LIST */}
                                            <div className="hidden md:grid grid-cols-1 gap-6">
                                                {activeInvites.map((invite, index) => (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} key={invite.id}>
                                                        <div className="group flex flex-col sm:flex-row bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                                                            {/* Ticket Stub (QR) */}
                                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-border/60 sm:w-[220px] shrink-0 gap-4 relative">
                                                                <div className="bg-white p-3 rounded-xl shadow-sm border border-border/40">
                                                                    <QRCodeSVG value={`${origin}/admin/scan?code=${invite.id}`} size={110} level="M" />
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full border border-dashed border-primary/30 cursor-pointer hover:border-primary hover:text-primary transition-colors" onClick={() => copyToClipboard(invite.id)}>
                                                                    <span className="font-mono text-xs font-bold tracking-wider">#{invite.id.slice(0, 8).toUpperCase()}</span>
                                                                    <Copy className="h-3 w-3 opacity-50" />
                                                                </div>
                                                                {/* Cutout Decorations */}
                                                                <div className="absolute -right-3 top-1/2 w-6 h-6 bg-background rounded-full transform -translate-y-1/2 border-l border-border/60 z-10 hidden sm:block border-t border-b" />
                                                                <div className="absolute -left-3 top-1/2 w-6 h-6 bg-background rounded-full transform -translate-y-1/2 border-r border-border/60 z-10 hidden sm:block border-t border-b" />
                                                            </div>

                                                            {/* Ticket Details */}
                                                            <div className="flex flex-col flex-1 p-6 justify-between relative bg-background">
                                                                <div>
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div>
                                                                            <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">Pass Invité</Badge>
                                                                            <h3 className="text-xl font-bold text-foreground tracking-tight">{invite.service_snapshot?.name || 'Service'}</h3>
                                                                        </div>
                                                                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{format(new Date(invite.created_at), "d MMMM yyyy", { locale: fr })}</span>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-3 mt-4">
                                                                        <div className="flex items-center gap-2 text-sm text-foreground/80 bg-muted/30 px-3 py-1.5 rounded-md"><Clock className="h-4 w-4 text-primary" /><span className="font-medium">{invite.duration} min</span></div>
                                                                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-md"><CheckCircle2 className="h-4 w-4" /><span className="font-medium">Valide</span></div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-end justify-between mt-8 pt-6 border-t border-dashed">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{userName.charAt(0).toUpperCase()}</div>
                                                                        <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Offert par</span><span className="text-sm font-medium text-foreground">{userName}</span></div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => handleShare(invite.id)}><Share2 className="h-3 w-3 mr-2" /> Partager</Button>
                                                                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-3 text-xs" onClick={() => handleCancel(invite.id)}><Trash2 className="h-3 w-3 mr-2" /> Annuler</Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </TabsContent>

                                <TabsContent value="history" className="mt-0 focus-visible:ring-0">
                                    {pastInvites.length === 0 ? (
                                        <EmptyState icon={History} title="Historique vide" description="Vos pass utilisés ou annulés apparaîtront ici." />
                                    ) : (
                                        <div className="rounded-xl border bg-card overflow-hidden shadow-sm divide-y">
                                            {pastInvites.map((invite) => (
                                                <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-muted/40 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${invite.status === 'used' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                            {invite.status === 'used' ? <CheckCircle2 className="h-6 w-6" /> : <Ban className="h-6 w-6" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-base text-foreground">{invite.service_snapshot?.name || 'Service'}</p>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {invite.duration} min</span>
                                                                <span>•</span>
                                                                <span>{format(new Date(invite.created_at), "d MMMM yyyy", { locale: fr })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge variant={invite.status === 'used' ? 'secondary' : 'outline'} className={`w-fit px-3 py-1 ${invite.status === 'cancelled' ? 'text-muted-foreground border-dashed' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                                        {invite.status === 'used' ? 'Utilisé' : 'Annulé'}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}