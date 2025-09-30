
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();

  return (
       <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-4 bg-background text-foreground hover:bg-muted"
        >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
        </Button>
  );
}
