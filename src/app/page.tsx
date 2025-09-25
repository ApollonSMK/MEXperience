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

export default function Home() {
  const [
    service1,
    service2,
    service3,
    service4
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
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-shadow-lg">
              Eleve o seu Bem-Estar na M.E Experience
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-gray-200">
              Seu santuário para relaxamento, rejuvenescimento e luxo.
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
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
                Nossos Serviços Exclusivos
              </h2>
              <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                Descubra tratamentos selecionados para harmonizar corpo e mente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
              {/* Row 1 */}
              <div className="md:col-span-3 lg:col-span-3 group relative h-96 rounded-lg overflow-hidden">
                {service1 && serviceImages[service1.id] && (
                  <Image
                    src={serviceImages[service1.id]!.imageUrl}
                    alt={serviceImages[service1.id]!.description}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={serviceImages[service1.id]!.imageHint}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h3 className="text-3xl font-headline font-bold">{service1?.name}</h3>
                  <p className="mt-2 max-w-md">{service1?.description}</p>
                </div>
              </div>
              <div className="md:col-span-3 lg:col-span-2 group relative h-96 rounded-lg overflow-hidden">
                {service2 && serviceImages[service2.id] && (
                  <Image
                    src={serviceImages[service2.id]!.imageUrl}
                    alt={serviceImages[service2.id]!.description}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={serviceImages[service2.id]!.imageHint}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h3 className="text-3xl font-headline font-bold">{service2?.name}</h3>
                   <p className="mt-2 max-w-md">{service2?.description}</p>
                </div>
              </div>

              {/* Row 2 */}
              <div className="md:col-span-3 lg:col-span-2 group relative h-96 rounded-lg overflow-hidden">
                 {service3 && serviceImages[service3.id] && (
                  <Image
                    src={serviceImages[service3.id]!.imageUrl}
                    alt={serviceImages[service3.id]!.description}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={serviceImages[service3.id]!.imageHint}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h3 className="text-3xl font-headline font-bold">{service3?.name}</h3>
                   <p className="mt-2 max-w-md">{service3?.description}</p>
                </div>
              </div>
              <div className="md:col-span-3 lg:col-span-3 group relative h-96 rounded-lg overflow-hidden">
                 {service4 && serviceImages[service4.id] && (
                  <Image
                    src={serviceImages[service4.id]!.imageUrl}
                    alt={serviceImages[service4.id]!.description}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={serviceImages[service4.id]!.imageHint}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h3 className="text-3xl font-headline font-bold">{service4?.name}</h3>
                   <p className="mt-2 max-w-md">{service4?.description}</p>
                </div>
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
