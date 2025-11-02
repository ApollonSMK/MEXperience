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

  const isDataLoading = isUserLoading || isUserDocLoading;

  useEffect(() => {
    if (!isDataLoading) {
      if (!user || !userData?.isAdmin) {
        router.push('/');
      }
    }
  }, [user, userData, isDataLoading, router]);
  
  const isLoading = isDataLoading;

  if (isLoading || !userData?.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        Vérification de l'accès...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
