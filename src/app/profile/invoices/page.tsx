
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: string;
    pdf_url: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = useCallback(async (userId: string) => {
    if (!supabase) {
        console.error("Supabase client not available");
        return;
    }
    setIsLoading(true);
    try {
        const { data: invoicesData, error: invoicesError } = await supabase.from('invoices').select('*').eq('user_id', userId).order('date', { ascending: false });
        if (invoicesError) throw new Error('Impossible de charger les factures.');
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
        setUser(currentUser);

        if (currentUser) {
            await fetchInvoices(currentUser.id);
        } else {
            router.push('/login');
        }
    };

    initializePage();
  }, [router, fetchInvoices]);


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
                            <TableHead>Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Facture</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length > 0 ? invoices.map(invoice => (
                            <TableRow key={invoice.id}>
                                <TableCell>{format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}</TableCell>
                                <TableCell>€{invoice.amount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={invoice.status === 'paid' ? 'secondary' : 'destructive'}>
                                        {invoice.status === 'paid' ? 'Payé' : 'En attente'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="sm" disabled={!invoice.pdf_url}>
                                        <a href={invoice.pdf_url || '#'} target="_blank" rel="noopener noreferrer">
                                            Voir PDF <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">Aucune facture trouvée.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
