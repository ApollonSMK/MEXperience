'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="w-full py-12 md:py-20 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Prêt à vivre l'expérience ?</h2>
            <p className="text-muted-foreground text-lg">
              Votre parcours vers le bien-être commence ici. Offrez-vous une pause et découvrez des soins conçus exclusivement pour vous. Réservez votre moment de détente dès aujourd'hui et laissez-nous prendre soin de tout le reste.
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link href="/agendar">
                Réserver Maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="relative h-80 md:h-[400px] w-full rounded-lg overflow-hidden shadow-xl">
            <Image
              src="https://supabase.me-experience.lu/storage/v1/object/public/images/All/imgi_286_IMG_1509.jpg"
              alt="Femme se relaxant dans un spa"
              layout="fill"
              objectFit="cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
