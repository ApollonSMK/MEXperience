'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminContent({
  isLoading,
  isAdmin,
  children,
}: {
  isLoading: boolean;
  isAdmin: boolean;
  children: ReactNode;
}) {
  const router = useRouter();

  console.log('[AdminContent] Renderizou com props:', { isLoading, isAdmin });

  useEffect(() => {
    console.log('[AdminContent Effect] Verificando acesso:', { isLoading, isAdmin });
    if (!isLoading && !isAdmin) {
      console.error('[AdminContent Effect] ACESSO NEGADO E REDIRECIONANDO!', { isLoading, isAdmin });
      router.push('/');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    console.log('[AdminContent] Ainda carregando, retornando null.');
    return null;
  }

  if (isAdmin) {
    console.log('[AdminContent] Acesso de Admin concedido. Renderizando conteúdo.');
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  console.log('[AdminContent] Não é admin e não está carregando. Retornando null para aguardar redirecionamento.');
  return null;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  console.log('[AdminLayout] Início da renderização:', { user, isUserLoading });

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) {
      console.log('[AdminLayout] useMemoFirebase: Firestore ou usuário não disponíveis. Retornando null.');
      return null;
    }
    console.log(`[AdminLayout] useMemoFirebase: Criando referência para o documento 'users/${user.uid}'`);
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc<any>(userDocRef);

  const isLoading = isUserLoading || isUserDocLoading;
  const isAdmin = !!userData?.isAdmin;

  console.log('[AdminLayout] Estado calculado:', {
    isUserLoading,
    isUserDocLoading,
    isLoading,
    userData,
    isAdmin,
  });

  if (isLoading) {
    console.log('[AdminLayout] Renderizando tela de carregamento...');
    return (
      <div className="flex h-screen items-center justify-center">
        Vérification de l'accès... (Depurando)
      </div>
    );
  }

  console.log('[AdminLayout] Carregamento concluído. Renderizando AdminContent.');
  return <AdminContent isLoading={false} isAdmin={isAdmin}>{children}</AdminContent>;
}
