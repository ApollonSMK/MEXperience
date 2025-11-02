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
    // Apenas executa a verificação quando o carregamento estiver concluído
    if (!isLoading) {
      // Se não houver usuário ou se o usuário não for um administrador, redireciona
      if (!user || !userData?.isAdmin) {
        router.push('/');
      }
    }
  }, [user, userData, isLoading, router]);

  // Enquanto carrega, ou se o usuário não for admin, exibe uma tela de espera.
  // A verificação `!userData?.isAdmin` previne que o conteúdo seja renderizado brevemente antes do redirecionamento.
  if (isLoading || !userData?.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        Vérification de l'accès...
      </div>
    );
  }

  // Se passou por todas as verificações, renderiza o layout de admin
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
