'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminContentProps {
  isLoading: boolean;
  isAdmin: boolean;
  children: ReactNode;
}

export default function AdminContent({ isLoading, isAdmin, children }: AdminContentProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
        <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">Vérification de l'accès...</h3>
                <p className="text-sm text-muted-foreground">
                    Veuillez patienter pendant que nous vérifions vos informations d'identification.
                </p>
            </div>
        </div>
    );
  }

  if (!isAdmin) {
    // Retornar null enquanto o redirecionamento está em andamento para evitar piscar de conteúdo.
    return null;
  }

  return <>{children}</>;
}
