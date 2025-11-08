'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'complete' | 'open' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando status do pagamento...');

  useEffect(() => {
    const fetchSessionStatus = async () => {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        setStatus('error');
        setMessage('ID da sessão não encontrado.');
        return;
      }
      
      try {
        const response = await fetch(`/api/stripe/session-status?session_id=${sessionId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Falha ao obter o status da sessão.');
        }

        setStatus(data.status);

        if (data.status === 'complete') {
            setMessage('Pagamento bem-sucedido! A sua subscrição está ativa.');
        } else if (data.status === 'open') {
             setMessage('Pagamento pendente ou falhou. Por favor, tente novamente.');
        }

      } catch (error: any) {
          setStatus('error');
          setMessage(error.message);
      }
    };

    fetchSessionStatus();
  }, [searchParams]);

  const renderStatus = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-4 text-2xl font-semibold">{message}</h1>
          </>
        );
      case 'complete':
        return (
          <>
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h1 className="mt-4 text-2xl font-semibold">Pagamento Concluído!</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button onClick={() => router.push('/profile/subscription')} className="mt-6">
                Ver Minha Subscrição
            </Button>
          </>
        );
      case 'open':
      case 'error':
        return (
           <>
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-2xl font-semibold">Pagamento Falhou</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button onClick={() => router.push('/abonnements')} className="mt-6">
                Tentar Novamente
            </Button>
          </>
        );
    }
  };

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center bg-background py-12 px-4 text-center">
        <div className="max-w-md w-full">
            {renderStatus()}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ReturnPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
            <ReturnContent />
        </Suspense>
    )
}
