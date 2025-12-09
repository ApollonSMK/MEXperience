'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

function NotFoundContent() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-20">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Page non trouvée</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Button asChild size="lg">
          <Link href="/">
            Retour à l'accueil
          </Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}