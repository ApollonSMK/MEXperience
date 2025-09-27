
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { services } from '@/lib/services';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check } from 'lucide-react';
import ServiceCard from '@/components/service-card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const servicePairImages: Record<
  string,
  { large?: (typeof PlaceHolderImages)[0]; small?: (typeof PlaceHolderImages)[0] }
> = {
  'collagen-boost': {
    large: PlaceHolderImages.find((img) => img.id === 'collagen-boost-large'),
    small: PlaceHolderImages.find((img) => img.id === 'collagen-boost-small'),
  },
  solarium: {
    large: PlaceHolderImages.find((img) => img.id === 'solarium-large'),
    small: PlaceHolderImages.find((img) => img.id === 'solarium-small'),
  },
  hydromassage: {
    large: PlaceHolderImages.find((img) => img.id === 'hydromassage-large'),
    small: PlaceHolderImages.find((img) => img.id === 'hydromassage-small'),
  },
  'infrared-dome': {
    large: PlaceHolderImages.find((img) => img.id === 'infrared-dome-large'),
    small: PlaceHolderImages.find((img) => img.id === 'infrared-dome-small'),
  },
};

export default function Home() {
  const [collagenBoost, solarium, hydromassage, infraredDome] = services;

  const plans = [
    {
      name: 'Bronze',
      price: 29,
      minutes: 60,
      features: ['Acesso a Collagen, Hydro e Domo'],
      popular: false,
    },
    {
      name: 'Prata',
      price: 49,
      minutes: 120,
      features: [
        'Acesso a Collagen, Hydro e Domo',
        'Prioridade no agendamento',
      ],
      popular: true,
    },
    {
      name: 'Ouro',
      price: 79,
      minutes: 200,
      features: [
        'Acesso a todos os serviços, incluindo Banco Solar',
        'Prioridade no agendamento',
        '10% de desconto em produtos',
      ],
      popular: false,
    },
  ].map((plan) => ({
    ...plan,
    pricePerMinute: (plan.price / plan.minutes).toFixed(2),
    avgSessions: Math.floor(plan.minutes / 30),
    pricePerSession: (plan.price / (plan.minutes / 30)).toFixed(2),
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <section className="relative w-full flex items-center justify-center text-center p-4 py-16 md:py-24">
          <div className="z-10 flex flex-col items-center justify-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-shadow-lg text-primary uppercase">
              O Melhor do Bem-Estar
            </h1>
            <blockquote className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground italic">
              "Uma oferta de serviço inovadora para cuidados individuais em toda
              a intimidade"
            </blockquote>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href="/booking">Agende sua Experiência</Link>
            </Button>
          </div>
        </section>

        <section id="services-grid" className="py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-4 space-y-8">
            {/* Row 1: Collagen Boost */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[350px]">
              <div className="md:col-span-2">
                <ServiceCard
                  service={collagenBoost}
                  image={servicePairImages['collagen-boost']?.large}
                />
              </div>
              <div className="relative group hidden md:block">
                {servicePairImages['collagen-boost']?.small && (
                  <Image
                    src={servicePairImages['collagen-boost'].small.imageUrl}
                    alt={servicePairImages['collagen-boost'].small.description}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={
                      servicePairImages['collagen-boost'].small.imageHint
                    }
                  />
                )}
              </div>
            </div>

            {/* Row 2: Solarium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[350px]">
              <div className="relative group hidden md:block">
                {servicePairImages['solarium']?.small && (
                  <Image
                    src={servicePairImages['solarium'].small.imageUrl}
                    alt={servicePairImages['solarium'].small.description}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={servicePairImages['solarium'].small.imageHint}
                  />
                )}
              </div>
              <div className="md:col-span-2">
                <ServiceCard
                  service={solarium}
                  image={servicePairImages['solarium']?.large}
                />
              </div>
            </div>

            {/* Row 3: Hydromassage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[350px]">
              <div className="md:col-span-2">
                <ServiceCard
                  service={hydromassage}
                  image={servicePairImages['hydromassage']?.large}
                />
              </div>
              <div className="relative group hidden md:block">
                {servicePairImages['hydromassage']?.small && (
                  <Image
                    src={servicePairImages['hydromassage'].small.imageUrl}
                    alt={servicePairImages['hydromassage'].small.description}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={
                      servicePairImages['hydromassage'].small.imageHint
                    }
                  />
                )}
              </div>
            </div>

            {/* Row 4: Infrared Dome */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[350px]">
              <div className="relative group hidden md:block">
                {servicePairImages['infrared-dome']?.small && (
                  <Image
                    src={servicePairImages['infrared-dome'].small.imageUrl}
                    alt={servicePairImages['infrared-dome'].small.description}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={
                      servicePairImages['infrared-dome'].small.imageHint
                    }
                  />
                )}
              </div>
              <div className="md:col-span-2">
                <ServiceCard
                  service={infraredDome}
                  image={servicePairImages['infrared-dome']?.large}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-primary">
                Nossos Planos de Subscrição
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Escolha o plano que melhor se adapta às suas necessidades e
                desfrute de benefícios exclusivos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={cn(
                    'flex flex-col border',
                    plan.popular
                      ? 'border-2 border-accent shadow-xl -translate-y-4'
                      : 'border-border'
                  )}
                >
                  <CardHeader className="text-center pb-4">
                    <CardTitle
                      className={cn(
                        'text-2xl font-headline',
                        plan.popular && 'text-3xl text-accent'
                      )}
                    >
                      {plan.name}
                    </CardTitle>
                    {plan.popular && (
                      <Badge
                        variant="default"
                        className="mx-auto mt-2 bg-accent text-accent-foreground"
                      >
                        O mais popular
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow space-y-6 pt-2">
                    <div className="text-center">
                      <span
                        className={cn(
                          'font-bold',
                          plan.popular ? 'text-6xl' : 'text-5xl'
                        )}
                      >
                        €{plan.price}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>

                    <div className="space-y-3 text-sm text-center">
                      <div className="flex justify-center items-baseline">
                        <span className="font-semibold text-lg text-foreground">
                          {plan.minutes}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          créditos/mês
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        (€{plan.pricePerMinute}/min)
                      </div>
                      <Separator />
                      <div className="flex justify-center items-baseline">
                        <span className="font-semibold text-lg text-foreground">
                          ~{plan.avgSessions} sessões
                        </span>
                        <span className="text-muted-foreground ml-1">
                          / mês
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        (€{plan.pricePerSession} / sessão de 30 min)
                      </div>
                    </div>

                    <ul className="space-y-3 pt-4">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={cn(
                        'w-full',
                        plan.popular
                          ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                          : ''
                      )}
                      variant={plan.popular ? 'default' : 'primary'}
                    >
                      Subscrever
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
