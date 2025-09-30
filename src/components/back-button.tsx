
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function BackButton() {
  const router = useRouter();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="icon"
            className="fixed bottom-8 left-8 z-50 h-14 w-14 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Voltar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Voltar à página anterior</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
