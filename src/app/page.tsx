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

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-1');

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
        <section className="sticky top-0 h-screen w-full flex items-center justify-center text-center text-white -z-10">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              priority
              data-ai-hint={heroImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-shadow-lg">
              Le Meilleur du Bien-être
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-gray-200 uppercase">
              Une offre de service innovante pour des soins individuels en toute
              intimité
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

        <section
          id="services-grid"
          className="relative py-16 md:py-24 bg-background z-10"
        >
          <div className="container mx-auto max-w-7xl px-4 space-y-8">
            {/* Row 1: Collagen Boost */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
              <div className="md:col-span-2 relative group">
                {servicePairImages['collagen-boost']?.large && (
                  <Image
                    src={servicePairImages['collagen-boost'].large.imageUrl}
                    alt={servicePairImages['collagen-boost'].large.description}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={
                      servicePairImages['collagen-boost'].large.imageHint
                    }
                  />
                )}
                <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
                <h3 className="absolute top-4 left-4 text-4xl font-headline font-bold text-white">
                  {collagenBoost.name}
                </h3>
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
              <div className="md:col-span-2 relative group">
                {servicePairImages['solarium']?.large && (
                  <Image
                    src={servicePairImages['solarium'].large.imageUrl}
                    alt={servicePairImages['solarium'].large.description}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={servicePairImages['solarium'].large.imageHint}
                  />
                )}
                <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
                <h3 className="absolute top-4 left-4 text-4xl font-headline font-bold text-white">
                  {solarium.name}
                </h3>
              </div>
            </div>

            {/* Row 3: Hydromassage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
              <div className="md:col-span-2 relative group">
                {servicePairImages['hydromassage']?.large && (
                  <Image
                    src={servicePairImages['hydromassage'].large.imageUrl}
                    alt={servicePairImages['hydromassage'].large.description}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={
                      servicePairImages['hydromassage'].large.imageHint
                    }
                  />
                )}
                <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
                <h3 className="absolute top-4 left-4 text-4xl font-headline font-bold text-white">
                  {hydromassage.name}
                </h3>
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
              <div className="md:col-span-2 relative group">
                {servicePairImages['infrared-dome']?.large && (
                  <Image
                    src={servicePairImages['infrared-dome'].large.imageUrl}
                    alt={servicePairImages['infrared-dome'].large.description}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={
                      servicePairImages['infrared-dome'].large.imageHint
                    }
                  />
                )}
                <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
                <h3 className="absolute top-4 left-4 text-4xl font-headline font-bold text-white">
                  {infraredDome.name}
                </h3>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button asChild variant="link" className="text-accent text-lg">
                <Link href="/services">Ver todos os serviços &rarr;</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="relative py-16 md:py-24 text-white">
          {subscriptionBgImage && (
            <Image
              src={subscriptionBgImage.imageUrl}
              alt={subscriptionBgImage.description}
              fill
              className="object-cover"
              data-ai-hint={subscriptionBgImage.imageHint}
            />
          )}
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
