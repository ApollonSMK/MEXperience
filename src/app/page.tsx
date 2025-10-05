
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { services as hardcodedServices } from '@/lib/services';
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
import { BookingModal } from '@/components/booking-modal';
import { getServices } from '@/lib/services-db';
import React from 'react';
import type { Service } from '@/lib/services';
import { MagicCard } from '@/components/ui/magic-card';
import { Particles } from '@/components/ui/particles';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { updateSubscription } from './profile/actions';


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

const plans = [
    {
      name: 'Bronze',
      price: 49,
      minutes: 50,
      sessions: '2 a 3 sessões/mês',
      features: [
        'Acesso a Collagen',
        'Acesso a Hydro',
        'Acesso a Domo',
      ],
      popular: false,
    },
    {
      name: 'Prata',
      price: 79,
      minutes: 90,
      sessions: '4 a 6 sessões/mês',
      features: [
        'Acesso a Collagen, Hydro e Domo',
        'Prioridade no agendamento',
        '1 Passe de Convidado por mês',
      ],
      popular: true,
    },
    {
      name: 'Gold',
      price: 99,
      minutes: 130,
      sessions: '6 a 9 sessões/mês',
      features: [
        'Acesso a todos os serviços',
        'Inclui Banco Solar',
        'Prioridade no agendamento',
        '10% de desconto em produtos',
        '3 Passes de Convidado por mês',
      ],
      popular: false,
    },
  ].map((plan) => ({
    ...plan,
    pricePerMinute: (plan.price / plan.minutes).toFixed(2),
  }));

function SubscribeButton({ planName, currentPlan, user }: { planName: string, currentPlan: string | null, user: User | null }) {
    if (!user) {
        return (
            <Button asChild className="w-full">
                <Link href="/login">Subscrever</Link>
            </Button>
        )
    }

    const isCurrentPlan = currentPlan === planName;

    if (isCurrentPlan) {
        return (
             <Button asChild variant="outline" className="w-full">
                <Link href="/profile">Gerir Subscrição</Link>
            </Button>
        )
    }

    return (
        <form action={updateSubscription}>
            <input type="hidden" name="planName" value={planName} />
            <Button 
                type="submit" 
                className="w-full"
                variant={planName === 'Prata' ? 'default' : 'outline'}
            >
                Subscrever
            </Button>
        </form>
    );
}

export default function Home() {
  const [services, setServices] = React.useState<Service[]>(hardcodedServices);
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<{subscription_plan: string | null} | null>(null);

  React.useEffect(() => {
    async function fetchInitialData() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('subscription_plan')
                .eq('id', user.id)
                .single();
            setProfile(profileData);
        }
    }
    fetchInitialData();

    // Listen for auth changes to update UI
     const supabase = createClient();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
         fetchInitialData();
      }
      if(event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };

  }, []);


  const [collagenBoost, solarium, hydromassage, infraredDome] = services;

  if (!collagenBoost || !solarium || !hydromassage || !infraredDome) {
    return <div>A carregar serviços...</div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <section className="relative w-full flex items-center justify-center text-center p-4 py-16 md:py-24 overflow-hidden">
          <Particles
            className="absolute inset-0"
            quantity={100}
            ease={80}
            color="hsl(var(--accent))"
            refresh
          />
          <div className="z-10 flex flex-col items-center justify-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-shadow-lg text-primary uppercase">
              O Melhor do Bem-Estar
            </h1>
            <blockquote className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground italic">
              "Uma oferta de serviço inovadora para cuidados individuais em toda
              a intimidade"
            </blockquote>
            <BookingModal services={services}>
                <Button
                    size="lg"
                    className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                    Agende sua Experiência
                </Button>
            </BookingModal>
          </div>
        </section>

        <section id="services-grid" className="py-16 md:py-24">
          <div className="container mx-auto max-w-screen-xl px-4">
            <div className="space-y-8">
              {/* Row 1: Collagen Boost */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[350px]">
                <div className="md:col-span-2">
                  <ServiceCard
                    service={collagenBoost}
                    image={servicePairImages['collagen-boost']?.large}
                    services={services}
                  />
                </div>
                <div className="relative group hidden md:block">
                  {servicePairImages['collagen-boost']?.small && (
                    <Image
                      src={servicePairImages['collagen-boost'].small.imageUrl}
                      alt={
                        servicePairImages['collagen-boost'].small.description
                      }
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
                      data-ai-hint={
                        servicePairImages['solarium'].small.imageHint
                      }
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <ServiceCard
                    service={solarium}
                    image={servicePairImages['solarium']?.large}
                    services={services}
                  />
                </div>
              </div>

              {/* Row 3: Hydromassage */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[350px]">
                <div className="md:col-span-2">
                  <ServiceCard
                    service={hydromassage}
                    image={servicePairImages['hydromassage']?.large}
                    services={services}
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
                      alt={
                        servicePairImages['infrared-dome'].small.description
                      }
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
                    services={services}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-primary uppercase">
                Nossos Planos de Subscrição
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Escolha o plano que melhor se adapta às suas necessidades e
                desfrute de benefícios exclusivos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan, index) => (
                <MagicCard
                  key={index}
                  className={cn(
                    'flex flex-col',
                    plan.popular ? 'shadow-xl -translate-y-4' : ''
                  )}
                >
                  <Card
                    className="flex flex-col flex-grow w-full h-full"
                  >
                    <CardHeader className="text-center pb-4">
                       <CardTitle
                        className={cn(
                          'text-2xl font-headline',
                          plan.popular ? 'text-3xl text-accent' : ''
                        )}
                      >
                        Plano {plan.name}
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
                            minutos/mês
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          (€{plan.pricePerMinute}/min)
                        </div>
                        <Separator />
                        <div className="flex justify-center items-baseline">
                          <span className="font-semibold text-lg text-foreground">
                            {plan.sessions}
                          </span>
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
                       <SubscribeButton planName={`Plano ${plan.name}`} currentPlan={profile?.subscription_plan || null} user={user} />
                    </CardFooter>
                  </Card>
                </MagicCard>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
