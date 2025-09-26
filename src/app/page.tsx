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

const subscriptionBgImage = PlaceHolderImages.find(
  (img) => img.id === 'subscription-bg'
);

export default function Home() {
  const [collagenBoost, solarium, hydromassage, infraredDome, ...otherServices] = services;
  const topServices = [collagenBoost, solarium, hydromassage, infraredDome];


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
          <div className="container mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 md:grid-cols-2 lg:grid-cols-4">
            {topServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                image={servicePairImages[service.id]?.large}
              />
            ))}
          </div>
        </section>

        <section
          className="relative py-16 md:py-24"
        >
          <div className="container relative z-10 mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-primary">
                Nossos Planos de Subscrição
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Escolha o plano que melhor se adapta às suas necessidades e
                desfrute de benefícios exclusivos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Plano 1 */}
              <Card className="flex flex-col border bg-transparent">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-headline">
                    Bronze
                  </CardTitle>
                  <CardDescription>Ideal para começar</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-6">
                  <div className="text-center">
                    <span className="text-5xl font-bold">€29</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>
                        <span className="font-semibold text-foreground">
                          60
                        </span>{' '}
                        minutos/mês
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Acesso a todos os serviços</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    variant="outline"
                  >
                    Subscrever
                  </Button>
                </CardFooter>
              </Card>

              {/* Plano 2 - Destaque */}
              <Card className="flex flex-col border-2 border-accent shadow-xl scale-105 bg-transparent">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl font-headline text-accent">
                    Prata
                  </CardTitle>
                  <CardDescription>O mais popular</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-6">
                  <div className="text-center">
                    <span className="text-6xl font-bold">€49</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>
                        <span className="font-semibold text-foreground">
                          120
                        </span>{' '}
                        minutos/mês
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Acesso a todos os serviços</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Prioridade no agendamento</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Subscrever
                  </Button>
                </CardFooter>
              </Card>

              {/* Plano 3 */}
              <Card className="flex flex-col border bg-transparent">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-headline">Ouro</CardTitle>
                  <CardDescription>A experiência completa</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-6">
                  <div className="text-center">
                    <span className="text-5xl font-bold">€79</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>
                        <span className="font-semibold text-foreground">
                          200
                        </span>{' '}
                        minutos/mês
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Acesso a todos os serviços</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Prioridade no agendamento</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>10% de desconto em produtos</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    variant="outline"
                  >
                    Subscrever
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
