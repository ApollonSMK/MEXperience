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
    // Only run the check once all data has finished loading.
    if (!isLoading) {
      // If, after loading, there's no user or the user is not an admin, redirect.
      if (!user || !userData?.isAdmin) {
        router.push('/');
      }
    }
  }, [user, userData, isLoading, router]);

  // Display the loading screen while any data is being fetched.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Vérification de l'accès...
      </div>
    );
  }

  // If loading is finished and the user is NOT an admin, we can show the loading screen again
  // just before the useEffect redirects them. This prevents a flash of the admin content.
  if (!userData?.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        Vérification de l'accès...
      </div>
    );
  }

  // If loading is finished and the user is an admin, render the layout.
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
