'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) {
      return null;
    }
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc<any>(userDocRef);

  // Combine loading states: still loading if auth is checking, or if doc is loading and we don't have data yet.
  const isLoading = isUserLoading || (isUserDocLoading && userData === undefined);
  const isAdmin = userData?.isAdmin === true;

  useEffect(() => {
    // Only perform actions once all data has settled.
    if (!isLoading) {
      // If after loading, there's no user or the user is not an admin, redirect.
      if (!user || !isAdmin) {
        router.push('/');
      }
    }
  }, [isLoading, user, isAdmin, router]);

  // While loading, show a consistent loading screen.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Vérification de l'accès...
      </div>
    );
  }

  // If loading is finished and the user is an admin, render the content.
  // The useEffect above will handle redirection for non-admins.
  if (isAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  // If not loading and not an admin, render null while redirection occurs.
  return null;
}
