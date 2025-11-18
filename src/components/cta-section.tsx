'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export function CtaSection() {
  return (
    <section className="relative w-full py-20 md:py-32 overflow-hidden">
      {/* Imagem de fundo SVG */}
      <Image
        src="https://supabase.me-experience.lu/storage/v1/object/public/images/Background/Back1.svg"
        alt="Decorative background"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 z-0"
      />
      {/* Sobreposição para garantir a legibilidade do texto */}
      <div className="absolute inset-0 bg-background/80 z-0" />

      {/* Conteúdo da Secção */}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Prêt à vivre l'expérience ?</h2>
            <p className="text-lg text-muted-foreground">
              Votre parcours vers le bien-être commence ici. Offrez-vous une pause et découvrez des soins conçus exclusivement pour vous. Réservez votre moment de détente dès aujourd'hui et laissez-nous prendre soin de tout le reste.
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link href="/agendar">
                Réserver Maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="relative w-full h-80 md:h-96 rounded-lg overflow-hidden shadow-xl">
             <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover"
              >
                <source src="https://supabase.me-experience.lu/storage/v1/object/public/images/Videos/Bancsolarvideo.mp4" type="video/mp4" />
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
          </div>
        </div>
      </div>
    </section>
  );
}
