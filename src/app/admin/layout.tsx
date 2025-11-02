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

  useEffect(() => {
    // This effect runs only when isLoading is false.
    // It handles the redirection logic once all data is loaded.
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isLoading, isAdmin, router]);

  // If still loading, we should not render children yet. The parent will show a loading screen.
  if (isLoading) {
    return null;
  }

  // If loading is complete and the user is an admin, render the admin content.
  if (isAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  // If loading is complete but the user is not an admin, they will be redirected.
  // We return null here to prevent flashing any content.
  return null;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc<any>(userDocRef);

  const isLoading = isUserLoading || isUserDocLoading;
  const isAdmin = !!userData?.isAdmin;

  // Render the loading screen centrally while any data is being fetched.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Vérification de l'accès...
      </div>
    );
  }

  // Once loading is complete, delegate to the AdminContent component for the final check and render.
  return <AdminContent isLoading={false} isAdmin={isAdmin}>{children}</AdminContent>;
}
