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

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc<any>(userDocRef);

  const isLoading = isUserLoading || isUserDocLoading;

  useEffect(() => {
    // Roda a verificação apenas quando o carregamento de ambos estiver concluído.
    if (!isLoading) {
      // Se, após o carregamento, não houver usuário ou o usuário não for admin, redireciona.
      if (!user || !userData?.isAdmin) {
        router.push('/');
      }
    }
  }, [user, userData, isLoading, router]);

  // Exibe a tela de carregamento enquanto qualquer um dos dados estiver sendo buscado.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Vérification de l'accès...
      </div>
    );
  }

  // Se o carregamento terminou e o usuário NÃO for admin, pode mostrar a tela de loading de novo
  // antes do useEffect redirecionar, evitando o piscar da tela.
  if (!userData?.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        Vérification de l'accès...
      </div>
    );
  }

  // Se o carregamento terminou e o usuário é admin, renderiza o layout.
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
