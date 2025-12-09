'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Loader2, FileText, Calendar, CreditCard, Receipt, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceDocument } from '@/components/invoice-document';
import { motion } from 'framer-motion';

interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: string;
    plan_title?: string;
    user_id: string;
}

interface UserProfile {
    display_name?: string;
    email?: string;
}

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed col-span-full">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
            <Receipt className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">Vous n'avez pas encore d'historique de paiement.</p>
    </div>
);

// Mobile Invoice Card
const InvoiceCardMobile = ({ invoice, onDownload, isGenerating }: any) => (
    <div className="bg-card border rounded-xl p-4 shadow-sm mb-4">
        <div className="flex justify-between items-start mb-3">
            <div>
                <h4 className="font-semibold text-foreground">{invoice.plan_title || 'Service M.E Experience'}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{invoice.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <Badge variant={invoice.status === 'paid' ? 'outline' : 'destructive'} className={invoice.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                {invoice.status === 'paid' ? 'Payé' : 'En attente'}
            </Badge>
        </div>
        
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}</span>
            <span className="font-bold text-foreground text-base">€{invoice.amount.toFixed(2)}</span>
        </div>

        <Button 
            onClick={() => onDownload(invoice)} 
            disabled={isGenerating === invoice.id} 
            className="w-full" variant="outline"
        >
            {isGenerating === invoice.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Télécharger PDF
        </Button>
    </div>
);

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Calculate Totals
  const totalSpent = useMemo(() => invoices.reduce((acc, curr) => acc + (curr.status === 'paid' ? curr.amount : 0), 0), [invoices]);
  const lastInvoiceDate = useMemo(() => invoices.length > 0 ? format(new Date(invoices[0].date), 'd MMMM yyyy', { locale: fr }) : '-', [invoices]);

  const fetchPageData = useCallback(async (userId: string) => {
    if (!supabase) {
        console.error("Supabase client not available");
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);

    try {
        const profilePromise = supabase.from('profiles').select('display_name, email').eq('id', userId).single();
        const invoicesPromise = supabase.from('invoices').select('*').eq('user_id', userId).order('date', { ascending: false });
        
        const [
            { data: profileData, error: profileError }, 
            { data: invoicesData, error: invoicesError }
        ] = await Promise.all([profilePromise, invoicesPromise]);

        if (profileError && profileError.code !== 'PGRST116') {
             throw new Error(`Impossible de charger le profil: ${profileError.message}`);
        }
        setUserProfile(profileData as UserProfile | null);

        if (invoicesError) {
            throw new Error(`Impossible de charger les factures: ${invoicesError.message}`);
        }
        setInvoices(invoicesData as Invoice[] || []);

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erreur de chargement",
            description: error.message || "Une erreur inattendue est survenue."
        });
    } finally {
        setIsLoading(false);
    }
  }, [supabase, toast]);


  useEffect(() => {
    const initializePage = async () => {
        const supabaseClient = getSupabaseBrowserClient();
        if (!supabaseClient) {
            router.push('/login');
            return;
        }

        const { data: { session } } = await supabaseClient.auth.getSession();
        const currentUser = session?.user;

        if (currentUser) {
            setUser(currentUser);
            await fetchPageData(currentUser.id);
        } else {
            router.push('/login');
        }
    };

    initializePage();
    
     const supabaseClient = getSupabaseBrowserClient();
     if(supabaseClient) {
        const { data: authListener } = supabaseClient.auth.onAuthStateChange(
          (event: AuthChangeEvent, session: Session | null) => {
            if (event === 'SIGNED_OUT') {
              router.push('/login');
            } else if (event === "SIGNED_IN" && session?.user) {
                setUser(session.user);
                fetchPageData(session.user.id);
            }
          }
        );
        return () => {
          authListener.subscription.unsubscribe();
        };
     }

  }, [router, fetchPageData]);

  const handleDownload = async (invoice: Invoice) => {
    setIsGenerating(invoice.id);
    toast({ title: 'Génération du PDF...', description: 'Veuillez patienter pendant que nous créons votre facture.' });

    const invoiceElement = document.getElementById(`invoice-${invoice.id}`);
    if (!invoiceElement) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de trouver le modèle de facture.' });
        setIsGenerating(null);
        return;
    }

    try {
        const canvas = await html2canvas(invoiceElement, {
            scale: 2, 
            useCORS: true,
            windowWidth: invoiceElement.scrollWidth,
            windowHeight: invoiceElement.scrollHeight,
        });
        const imgData = canvas.toDataURL('image/png');
        
        // Use A4 paper size for consistency
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasAspectRatio = canvasHeight / canvasWidth;

        // Calculate image dimensions to fit A4, maintaining aspect ratio
        let imgWidth = pdfWidth;
        let imgHeight = pdfWidth * canvasAspectRatio;
        
        // If height is too large, scale based on height instead
        if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = pdfHeight / canvasAspectRatio;
        }
        
        // Center the image on the page
        const xOffset = (pdfWidth - imgWidth) / 2;
        
        pdf.addImage(imgData, 'PNG', xOffset, 0, imgWidth, imgHeight);
        pdf.save(`facture-${invoice.id}.pdf`);
        
        toast({ title: 'Téléchargement Terminé!', description: 'Votre facture a été téléchargée avec succès.' });

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ variant: 'destructive', title: 'Erreur de Génération', description: 'Un problème est survenu lors de la création du PDF.' });
    } finally {
        setIsGenerating(null);
    }
  };

  if (isLoading || !user) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Chargement de vos factures...</p>
             </div>
        </div>
    )
  }

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-background pb-12">
        
        {/* HEADER BANNER */}
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 border-b py-8 mb-8">
            <div className="container mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 shrink-0 bg-background hover:bg-background/80">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Mes Factures</h1>
                        <p className="text-sm text-muted-foreground">Consultez et téléchargez vos documents.</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* LEFT COLUMN: Summary */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                     <Card className="border-t-4 border-t-primary shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Dépensé</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold tracking-tight">€{totalSpent.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Depuis votre inscription</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50 dark:bg-slate-900/50 border-dashed shadow-sm">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shrink-0 shadow-sm">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Besoin d'aide ?</h3>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Si vous constatez une erreur sur une facture, contactez notre support à support@me-experience.lu
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Invoices List */}
                <div className="lg:col-span-2">
                    {invoices.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="block md:hidden">
                                {invoices.map(invoice => (
                                    <InvoiceCardMobile key={invoice.id} invoice={invoice} onDownload={handleDownload} isGenerating={isGenerating} />
                                ))}
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
                                <div className="grid grid-cols-1 divide-y">
                                    {invoices.map((invoice, index) => (
                                        <motion.div 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }} 
                                            transition={{ delay: index * 0.05 }}
                                            key={invoice.id} 
                                            className="flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                    <Receipt className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{invoice.plan_title || 'Service M.E Experience'}</p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span>{format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}</span>
                                                        <span>•</span>
                                                        <span className="font-mono text-xs">#{invoice.id.slice(0,8).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="font-bold">€{invoice.amount.toFixed(2)}</p>
                                                    <Badge variant={invoice.status === 'paid' ? 'outline' : 'destructive'} className={`mt-1 text-[10px] h-5 px-2 ${invoice.status === 'paid' ? 'text-green-600 bg-green-50 border-green-200' : ''}`}>
                                                        {invoice.status === 'paid' ? 'Payé' : 'En attente'}
                                                    </Badge>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDownload(invoice)}
                                                    disabled={isGenerating === invoice.id}
                                                    className="h-9 w-9 text-muted-foreground hover:text-primary"
                                                >
                                                     {isGenerating === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
             </div>
        </div>
      </main>
      <Footer />
      {/* Hidden invoice templates for PDF generation */}
      <div className="fixed -left-[9999px] top-0 opacity-0 -z-10" aria-hidden="true">
        {invoices.map(invoice => (
          <div key={`pdf-${invoice.id}`} id={`invoice-${invoice.id}`}>
            <InvoiceDocument 
                data={{
                    id: invoice.id,
                    date: invoice.date,
                    description: invoice.plan_title || 'Service',
                    amount: invoice.amount,
                    method: 'Stripe', 
                    client: userProfile?.display_name || userProfile?.email || 'Client',
                    user_id: invoice.user_id
                }} 
            />
          </div>
        ))}
      </div>
    </>
  );
}