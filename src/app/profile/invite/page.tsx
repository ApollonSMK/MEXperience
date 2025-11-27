'use client';

import { useState, useEffect } from 'react';
import { generateInvitation, cancelInvitation } from '@/app/actions/invitations';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Plus, Trash2, Ticket, History, Ban, CheckCircle2, Clock, Copy, Share2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import html2canvas from 'html2canvas';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

// --- MOBILE CAROUSEL COMPONENT ---
const MobileInviteCarousel = ({ 
    invites, 
    userName, 
    onCopy, 
    onCancel,
    onShare,
    onDownload
}: { 
    invites: Invitation[], 
    userName: string, 
    onCopy: (id: string) => void, 
    onCancel: (id: string) => void,
    onShare: (id: string) => void,
    onDownload: (id: string) => void
}) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ 
        loop: false, 
        align: 'center',
        containScroll: 'trimSnaps',
        dragFree: false
    });

    useEffect(() => {
        if (!emblaApi) return;

        const tweenFactor = 4.5;
        const tweenNodes = emblaApi.slideNodes();

        const applyTween = () => {
            emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
                let diffToTarget = scrollSnap - emblaApi.scrollProgress();
                const slidesInSnap = emblaApi.slidesInView().filter(index => index === snapIndex);

                slidesInSnap.forEach(() => {
                    const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor);
                    const scale = Math.min(Math.max(tweenValue, 0.85), 1);
                    const opacity = Math.min(Math.max(tweenValue, 0.5), 1);
                    const zIndex = Math.round(tweenValue * 100);

                    const slide = tweenNodes[snapIndex];
                    if (slide) {
                        slide.style.transform = `scale(${scale})`;
                        slide.style.opacity = `${opacity}`;
                        slide.style.zIndex = `${zIndex}`;
                        slide.style.filter = scale < 0.95 ? 'blur(1px)' : 'none';
                    }
                });
            });
        };

        emblaApi.on('scroll', applyTween);
        emblaApi.on('reInit', applyTween);
        emblaApi.on('select', applyTween);
        
        applyTween();
    }, [emblaApi]);

    return (
        <div className="overflow-hidden py-8 -mx-4" ref={emblaRef}>
            <div className="flex touch-pan-y touch-pinch-zoom ml-[calc(50%-140px)]"> 
                {invites.map((invite) => (
                    <div key={invite.id} className="flex-[0_0_280px] min-w-0 relative px-2 transition-all duration-300 ease-out">
                        <div id={`ticket-mobile-${invite.id}`} className="bg-background border rounded-2xl overflow-hidden shadow-xl flex flex-col h-[490px]">
                            <div className="bg-primary/5 flex-1 flex flex-col items-center justify-center p-6 relative">
                                <div className="bg-white p-3 rounded-xl shadow-sm border border-border/40">
                                    <QRCodeSVG value={invite.id} size={140} level="M" />
                                </div>
                                <div 
                                    className="mt-4 flex items-center gap-2 bg-background px-3 py-1 rounded-full border border-dashed border-primary/30 cursor-pointer active:scale-95 transition-transform"
                                    onClick={() => onCopy(invite.id)}
                                >
                                    <span className="font-mono text-xs font-bold tracking-wider">
                                        #{invite.id.slice(0, 8).toUpperCase()}
                                    </span>
                                    <Copy className="h-3 w-3 opacity-50" />
                                </div>
                            </div>

                            <div className="p-5 flex flex-col justify-between bg-card flex-1">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Pass Invité</Badge>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {format(new Date(invite.created_at), "d MMM", { locale: fr })}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground tracking-tight line-clamp-1">
                                        {invite.service_snapshot?.name || 'Service'}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{invite.duration} min</span>
                                        <span className="mx-1">•</span>
                                        <span className="text-[10px] uppercase font-bold">Offert par {userName.split(' ')[0]}</span>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="w-full" onClick={() => onShare(invite.id)}>
                                            <Share2 className="h-3 w-3 mr-2" /> Partager
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-full" onClick={() => onDownload(invite.id)}>
                                            <Download className="h-3 w-3 mr-2" /> Télécharger
                                        </Button>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => onCancel(invite.id)}
                                    >
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Annuler
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface Invitation {
    id: string;
    status: 'active' | 'used' | 'cancelled';
    created_at: string;
    used_at?: string;
    duration?: number;
    service_snapshot?: { name: string };
}

interface Service {
    id: string;
    name: string;
    pricing_tiers: { duration: number, price: number }[];
}

export default function InvitePage() {
    const { toast } = useToast();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [userBalance, setUserBalance] = useState(0);
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('');

    const supabase = getSupabaseBrowserClient();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copié !", description: "Code copié dans le presse-papier." });
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return;

        const { data: invites } = await supabase.from('invitations').select('*').eq('host_user_id', user.id).order('created_at', { ascending: false });
        if (invites) setInvitations(invites as any[]);

        const { data: servicesData } = await supabase.from('services').select('*').eq('is_under_maintenance', false).order('order');
        if (servicesData) setServices(servicesData as Service[]);

        const { data: profile } = await supabase.from('profiles').select('minutes_balance, display_name, first_name, last_name').eq('id', user.id).single();
        if (profile) {
            setUserBalance(profile.minutes_balance || 0);
            const name = profile.display_name || (profile.first_name ? `${profile.first_name} ${profile.last_name}` : user.email?.split('@')[0] || 'Client');
            setUserName(name);
        }

        setIsLoading(false);
    };

    const handleGenerate = async () => {
        if (!selectedServiceId || !selectedDuration) return;
        setIsGenerating(true);
        try {
            const res = await generateInvitation(selectedServiceId, parseInt(selectedDuration));
            if (!res.success) {
                toast({ variant: 'destructive', title: 'Erreur', description: res.error });
            } else {
                toast({ title: 'Succès', description: 'Nouvelle invitation générée !' });
                setIsDialogOpen(false);
                setSelectedServiceId('');
                setSelectedDuration('');
                loadData();
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
        }
        setIsGenerating(false);
    };

    const handleCancel = async (id: string) => {
        if(!confirm("Voulez-vous vraiment annuler cette invitation ?")) return;
        await cancelInvitation(id);
        loadData();
        toast({ title: 'Annulé', description: 'L\'invitation a été invalidée.' });
    };

    const handleDownload = async (inviteId: string, view: 'mobile' | 'desktop') => {
        const element = document.getElementById(`ticket-${view}-${inviteId}`);
        if (!element) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de trouver l\'élément du ticket.' });
            return;
        }
        toast({ title: 'Téléchargement en cours...', description: 'Votre pass est en cours de préparation.' });
        try {
            const canvas = await html2canvas(element, { useCORS: true, backgroundColor: '#ffffff', scale: 2 });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `pass-invite-me-experience-${inviteId.slice(0, 8)}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error generating ticket image:', error);
            toast({ variant: 'destructive', title: 'Erreur de téléchargement', description: 'Une erreur est survenue.' });
        }
    };

    const handleShare = async (inviteId: string) => {
        const shareData = {
            title: 'Invitation M.E Experience',
            text: `Vous avez reçu un pass invité pour M.E Experience ! Utilisez ce code pour réserver : ${inviteId}`,
            url: window.location.href,
        };
        if (navigator.share && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.log('Share failed:', error);
                copyToClipboard(inviteId);
            }
        } else {
            copyToClipboard(inviteId);
            toast({ title: 'Code copié !', description: 'Le code a été copié. Partagez-le avec votre invité.' });
        }
    };

    const selectedService = services.find(s => s.id === selectedServiceId);
    const durationNum = parseInt(selectedDuration || '0');
    const hasEnoughBalance = userBalance >= durationNum;

    const activeInvites = invitations.filter(i => i.status === 'active');
    const pastInvites = invitations.filter(i => i.status !== 'active');

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50/50 dark:bg-zinc-900/50">
                <div className="container max-w-5xl py-8 px-4 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b pb-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Passes Invité</h1>
                            <p className="text-muted-foreground mt-2 max-w-xl">
                                Offrez une expérience bien-être à vos proches. Générez un pass unique déduit de votre solde actuel de <span className="font-semibold text-foreground">{userBalance} min</span>.
                            </p>
                        </div>
                        
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="rounded-full px-6">
                                    <Plus className="mr-2 h-4 w-4" />
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
                                            <Ban className="w-4 h-4 mr-2" /> Solde insuffisant pour cette durée.
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

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse">Chargement de vos pass...</p>
                        </div>
                    ) : (
                        <Tabs defaultValue="active" className="w-full">
                            <TabsList className="mb-6 bg-muted/50 p-1">
                                <TabsTrigger value="active" className="px-6">Actifs ({activeInvites.length})</TabsTrigger>
                                <TabsTrigger value="history" className="px-6">Historique ({pastInvites.length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="active" className="space-y-6">
                                {activeInvites.length === 0 ? (
                                    <EmptyState icon={Ticket} title="Aucun pass actif" description="Vous n'avez aucun pass en attente d'utilisation." action={<Button variant="outline" onClick={() => setIsDialogOpen(true)}>Créer mon premier pass</Button>} />
                                ) : (
                                    <>
                                        <div className="block md:hidden">
                                            <MobileInviteCarousel invites={activeInvites} userName={userName} onCopy={copyToClipboard} onCancel={handleCancel} onShare={handleShare} onDownload={(id) => handleDownload(id, 'mobile')} />
                                            <p className="text-center text-xs text-muted-foreground mt-2">Glissez pour voir les autres passes</p>
                                        </div>
                                        <div className="hidden md:grid grid-cols-1 gap-6">
                                            {activeInvites.map((invite, index) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} key={invite.id}>
                                                    <div id={`ticket-desktop-${invite.id}`} className="group flex flex-col sm:flex-row bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                                                        <div className="bg-primary/5 p-6 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-border/60 sm:w-[240px] shrink-0 gap-4 relative">
                                                            <div className="bg-white p-3 rounded-xl shadow-sm border border-border/40"><QRCodeSVG value={invite.id} size={110} level="M" /></div>
                                                            <div className="flex items-center gap-2 bg-background px-4 py-1.5 rounded-full border border-dashed border-primary/30 cursor-pointer hover:border-primary hover:text-primary transition-colors" onClick={() => copyToClipboard(invite.id)}>
                                                                <span className="font-mono text-sm font-bold tracking-wider">#{invite.id.slice(0, 8).toUpperCase()}</span>
                                                                <Copy className="h-3 w-3 opacity-50" />
                                                            </div>
                                                            <div className="absolute -right-3 top-1/2 w-6 h-6 bg-background rounded-full transform -translate-y-1/2 border border-border/60 z-10 hidden sm:block" />
                                                            <div className="absolute -left-3 top-1/2 w-6 h-6 bg-background rounded-full transform -translate-y-1/2 border-r border-border/60 z-10 hidden sm:block" />
                                                        </div>
                                                        <div className="flex flex-col flex-1 p-6 sm:p-7 justify-between relative bg-background">
                                                            <div>
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">Pass Invité</Badge>
                                                                        <h3 className="text-2xl font-bold text-foreground tracking-tight">{invite.service_snapshot?.name || 'Service'}</h3>
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
                                                                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => handleDownload(invite.id, 'desktop')}><Download className="h-3 w-3 mr-2" /> Télécharger</Button>
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

                            <TabsContent value="history">
                                {pastInvites.length === 0 ? (
                                    <EmptyState icon={History} title="Historique vide" description="Vos pass utilisés ou annulés apparaîtront ici." />
                                ) : (
                                    <div className="rounded-xl border bg-card/50 overflow-hidden shadow-sm">
                                        {pastInvites.map((invite, index) => (
                                            <div key={invite.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 ${index !== pastInvites.length - 1 ? 'border-b border-border/50' : ''} hover:bg-muted/40 transition-colors`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${invite.status === 'used' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
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
                                                <Badge variant={invite.status === 'used' ? 'secondary' : 'outline'} className={`w-fit px-3 py-1 ${invite.status === 'cancelled' ? 'text-muted-foreground border-dashed' : 'bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200'}`}>
                                                    {invite.status === 'used' ? 'Utilisé' : 'Annulé'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: any, title: string, description: string, action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-xl bg-muted/5">
            <div className="h-16 w-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Icon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
            {action}
        </div>
    );
}