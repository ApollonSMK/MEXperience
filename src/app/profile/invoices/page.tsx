'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceDocument } from '@/components/invoice-document';

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

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

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
          (event, session) => {
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
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto max-w-4xl px-4 py-8">
                 <Skeleton className="h-8 w-48 mb-8" />
                 <Skeleton className="h-96 w-full" />
            </main>
            <Footer />
        </div>
    )
  }

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.push('/profile')} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Mes Factures</h1>
          </div>

          <Card>
            <CardHeader>
                <CardTitle>Historique de Facturation</CardTitle>
                <CardDescription>Consultez vos paiements et téléchargez vos factures.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Facture</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length > 0 ? invoices.map(invoice => (
                            <TableRow key={invoice.id}>
                                <TableCell>{format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}</TableCell>
                                <TableCell className="font-medium">{invoice.plan_title || 'Serviço Avulso'}</TableCell>
                                <TableCell>€{invoice.amount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={invoice.status === 'paid' ? 'secondary' : 'destructive'}>
                                        {invoice.status === 'paid' ? 'Payé' : 'En attente'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button onClick={() => handleDownload(invoice)} variant="ghost" size="sm" disabled={isGenerating === invoice.id}>
                                       {isGenerating === invoice.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                       PDF
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">Aucune facture trouvée.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      {/* Hidden invoice templates for PDF generation */}
      <div className="fixed -left-[9999px] top-0 opacity-0 -z-10" aria-hidden="true">
        {invoices.map(invoice => (
          <div key={`pdf-${invoice.id}`} id={`invoice-${invoice.id}`}>
            <InvoiceDocument invoice={invoice} user={userProfile}/>
          </div>
        ))}
      </div>
    </>
  );
}