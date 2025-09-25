import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { services } from '@/lib/services';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-1');

const serviceImages = services.reduce(
  (acc, service) => {
    acc[service.id] = PlaceHolderImages.find(
      (img) => img.id === service.imageId
    );
    return acc;
  },
  {} as Record<string, (typeof PlaceHolderImages)[0] | undefined>
);

const servicePairImages: Record<string, { large?: typeof PlaceHolderImages[0], small?: typeof PlaceHolderImages[0] }> = {
  'collagen-boost': {
    large: PlaceHolderImages.find((img) => img.id === 'collagen-boost-large'),
    small: PlaceHolderImages.find((img) => img.id === 'collagen-boost-small'),
  },
  'solarium': {
    large: PlaceHolderImages.find((img) => img.id === 'solarium-large'),
    small: PlaceHolderImages.find((img) => img.id === 'solarium-small'),
  },
  'hydromassage': {
    large: PlaceHolderImages.find((img) => img.id === 'hydromassage-large'),
    small: PlaceHolderImages.find((img) => img.id === 'hydromassage-small'),
  },
  'infrared-dome': {
    large: PlaceHolderImages.find((img) => img.id === 'infrared-dome-large'),
    small: PlaceHolderImages.find((img) => img.id === 'infrared-dome-small'),
  },
};


export default function Home() {
  const [
    collagenBoost,
    solarium,
    hydromassage,
    infraredDome,
  ] = services;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <section className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center text-center text-white">
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
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-shadow-lg text-primary">
              Le Meilleur du Bien-être
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-gray-200 uppercase text-accent">
              Une offre de service innovante pour des soins individuels en toute intimité
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

        <section id="services-grid" className="py-16 md:py-24 bg-background">
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
                    data-ai-hint={servicePairImages['collagen-boost'].large.imageHint}
                  />
                )}
                 <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
                <h3 className="absolute top-4 left-4 text-4xl font-headline font-bold text-white">{collagenBoost.name}</h3>
              </div>
              <div className="relative group hidden md:block">
                 {servicePairImages['collagen-boost']?.small && (
                  <Image
                    src={servicePairImages['collagen-boost'].small.imageUrl}
                    alt={servicePairImages['collagen-boost'].small.description}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={servicePairImages['collagen-boost'].small.imageHint}
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
                <h3 className="absolute top-4 left-4 text-4xl font-headline font-bold text-white">{solarium.name}</h3>
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
                    data-ai-hint={servicePairImages['hydromassage'].large.imageHint}
                  />
                )}
                 <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
                <h3 className="absolute top-4 left-4 text-4xl font-headline font-bold text-white">{hydromassage.name}</h3>
              </div>
              <div className="relative group hidden md:block">
                 {servicePairImages['hydromassage']?.small && (
                  <Image
                    src={servicePairImages['hydromassage'].small.imageUrl}
                    alt={servicePairImages['hydromassage'].small.description}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={servicePairImages['hydromassage'].small.imageHint}
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
                    data-ai-hint={servicePairImages['infrared-dome'].small.imageHint}
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
                    data-ai-hint={servicePairImages['infrared-dome'].large.imageHint}
                  />
                )}
                <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
                <h3 className="absolute top-4 left-4 text-4xl font-headline font-bold text-white">{infraredDome.name}</h3>
              </div>
            </div>


            <div className="text-center mt-12">
              <Button asChild variant="link" className="text-accent text-lg">
                <Link href="/services">Ver todos os serviços &rarr;</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
