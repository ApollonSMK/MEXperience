'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

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
    // Só redireciona se o carregamento estiver concluído e o usuário não for admin.
    if (!isLoading && !isAdmin) {
      console.error('[AdminContent Effect] ACESSO NEGADO E REDIRECIONANDO!', { isLoading, isAdmin });
      router.push('/');
    }
  }, [isLoading, isAdmin, router]);

  // Se estiver carregando, não renderiza nada para esperar a decisão do useEffect.
  if (isLoading) {
    console.log('[AdminContent] Ainda carregando, renderizando null.');
    return <div className="flex h-screen items-center justify-center">Vérification de l'accès...</div>;
  }

  // Se for admin, renderiza o conteúdo.
  if (isAdmin) {
    console.log('[AdminContent] Acesso de Admin concedido. Renderizando conteúdo.');
    return <>{children}</>;
  }

  // Se não for admin (e não estiver carregando), retorna null enquanto o useEffect redireciona.
  console.log('[AdminContent] Não é admin e não está carregando. Retornando null para aguardar redirecionamento.');
  return <div className="flex h-screen items-center justify-center">Redirecionando...</div>;
}


export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  console.log('[AdminLayout] Início da renderização:', { user: user ? 'UserImpl' : null, isUserLoading });

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) {
      console.log('[AdminLayout] useMemoFirebase: user ou firestore indisponível. Retornando null.');
      return null;
    }
    console.log(`[AdminLayout] useMemoFirebase: Criando referência para o documento 'users/${user.uid}'`);
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc<any>(userDocRef);

  // Lógica de carregamento mais estrita: consideramos carregando se a autenticação está pendente
  // ou se a leitura do documento está pendente E ainda não temos dados (nem mesmo `null` de uma leitura concluída).
  const isLoading = isUserLoading || (isUserDocLoading && userData === undefined);
  const isAdmin = userData?.isAdmin === true;

  console.log('[AdminLayout] Estado calculado:', { isUserLoading, isUserDocLoading, isLoading, userData, isAdmin });

  // A decisão de renderização é simplificada.
  // O componente de carregamento é mostrado se `isLoading` for verdadeiro.
  if (isLoading) {
    console.log('[AdminLayout] Renderizando tela de carregamento...');
    return (
      <div className="flex h-screen items-center justify-center">
        Vérification de l'accès...
      </div>
    );
  }

  // Se o carregamento terminou, delegamos a decisão final para o AdminContent
  console.log('[AdminLayout] Carregamento concluído. Renderizando conteúdo principal.');
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
