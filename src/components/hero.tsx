import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export function Hero() {
  return (
    <div className="flex min-h-screen-minus-header w-full items-center justify-center bg-background">
      <main className="mx-auto flex max-w-4xl flex-col items-center justify-center space-y-8 px-4 text-center">
        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <Zap className="h-4 w-4 text-primary" />
          <span>Template Genesis</span>
        </div>
        <h1 className="font-headline text-4xl font-bold tracking-tighter text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Construisez et lancez plus rapidement
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
          Un modèle Next.js épuré et minimaliste avec Tailwind CSS, Shadcn UI et
          Radix UI. Prêt pour que vous construisiez quelque chose d'incroyable.
        </p>
        <div className="flex w-full max-w-sm flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Button size="lg" className="w-full">
            Commencer
          </Button>
          <Button size="lg" variant="outline" className="w-full">
            En savoir plus
          </Button>
        </div>
      </main>
    </div>
  );
}
