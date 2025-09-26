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
  const [collagenBoost, solarium, hydromassage, infraredDome] = services;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <section className="h-[calc(100vh-4rem)] w-full flex items-center justify-center text-center">
          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-shadow-lg text-white">
              O Melhor do Bem-Estar
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-foreground uppercase">
              Uma oferta de serviço inovadora para cuidados individuais em toda
              a intimidade
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href="/booking">Agende sua Experiência</Link>
            </Button>
          </div>
        </section>

        <section id="services-grid" className="relative py-16 md:py-24 z-10">
          <div className="container mx-auto max-w-7xl px-4 space-y-8">
            {/* Row 1: Collagen Boost */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
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

            <div className="text-center mt-12">
              <Button asChild variant="link" className="text-accent text-lg">
                <Link href="/services">Ver todos os serviços &rarr;</Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          className="relative py-16 md:py-24 text-white bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: subscriptionBgImage
              ? `url(${subscriptionBgImage.imageUrl})`
              : 'none',
          }}
        >
          <div className="absolute inset-0 bg-black/60" />

          <div className="container relative z-10 mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-primary">
                Nossos Planos de Subscrição
              </h2>
              <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
                Escolha o plano que melhor se adapta às suas necessidades e
                desfrute de benefícios exclusivos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Plano 1 */}
              <Card className="flex flex-col bg-card/80 backdrop-blur-sm">
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
              <Card className="flex flex-col border-2 border-accent shadow-xl scale-105 bg-card/80 backdrop-blur-sm">
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
              <Card className="flex flex-col bg-card/80 backdrop-blur-sm">
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
