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

  useEffect(() => {
    // Redirect only if loading is complete and user is not an admin.
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isLoading, isAdmin, router]);

  // If still loading, wait before rendering anything.
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Vérification de l'accès...</div>;
  }

  // If admin, render the content.
  if (isAdmin) {
    return <>{children}</>;
  }

  // If not admin (and not loading), return null while useEffect redirects.
  return <div className="flex h-screen items-center justify-center">Redirecionando...</div>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) {
      return null;
    }
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc<any>(userDocRef);

  // The final loading state depends on auth and the document read.
  const isLoading = isUserLoading || (userDocRef && isUserDocLoading);
  const isAdmin = userData?.isAdmin === true;

  // The final decision logic is now inside AdminContent.
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <AdminContent isLoading={isLoading} isAdmin={isAdmin}>
          {children}
        </AdminContent>
      </main>
      <Footer />
    </div>
  );
}
