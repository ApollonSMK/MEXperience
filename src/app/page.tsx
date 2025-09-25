import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { services } from '@/lib/services';
import type { Service } from '@/lib/services';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-1');
const testimonialImages = {
  'testimonial-1': PlaceHolderImages.find((img) => img.id === 'testimonial-1'),
  'testimonial-2': PlaceHolderImages.find((img) => img.id === 'testimonial-2'),
};
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
  const featuredServices = services.slice(0, 3);

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
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-shadow-lg">
              Eleve o seu Bem-Estar na M.E Experience
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
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

        <section id="services" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
                Nossos Serviços Exclusivos
              </h2>
              <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                Descubra tratamentos selecionados para harmonizar corpo e mente.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredServices.map((service) => (
                <Card
                  key={service.id}
                  className="bg-card border-border overflow-hidden group transform transition-transform duration-300 hover:-translate-y-2"
                >
                  <CardHeader className="p-0">
                    {serviceImages[service.id] && (
                      <Image
                        src={serviceImages[service.id]!.imageUrl}
                        alt={serviceImages[service.id]!.description}
                        width={600}
                        height={400}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={serviceImages[service.id]!.imageHint}
                      />
                    )}
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <service.icon className="w-8 h-8 text-accent" />
                      <CardTitle className="font-headline text-2xl">
                        {service.name}
                      </CardTitle>
                    </div>
                    <p className="text-muted-foreground mb-6">
                      {service.description}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    >
                      <Link href={`/booking?service=${service.id}`}>
                        Saber Mais e Agendar
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button asChild variant="link" className="text-accent text-lg">
                <Link href="/services">Ver todos os serviços &rarr;</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-secondary">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
                O Que Nossos Clientes Dizem
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-card">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  {testimonialImages['testimonial-1'] && (
                    <Avatar className="w-20 h-20 mb-4 border-2 border-accent">
                      <AvatarImage
                        src={testimonialImages['testimonial-1'].imageUrl}
                        alt="Cliente 1"
                        data-ai-hint={
                          testimonialImages['testimonial-1'].imageHint
                        }
                      />
                      <AvatarFallback>C1</AvatarFallback>
                    </Avatar>
                  )}
                  <p className="text-muted-foreground mb-4">
                    "Uma experiência absolutamente transformadora. Sinto-me
                    renovada e cheia de energia. O melhor centro de bem-estar!"
                  </p>
                  <p className="font-bold font-headline text-foreground">
                    Ana Silva
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  {testimonialImages['testimonial-2'] && (
                    <Avatar className="w-20 h-20 mb-4 border-2 border-accent">
                      <AvatarImage
                        src={testimonialImages['testimonial-2'].imageUrl}
                        alt="Cliente 2"
                        data-ai-hint={
                          testimonialImages['testimonial-2'].imageHint
                        }
                      />
                      <AvatarFallback>C2</AvatarFallback>
                    </Avatar>
                  )}
                  <p className="text-muted-foreground mb-4">
                    "O profissionalismo e o ambiente luxuoso são incomparáveis.
                    A hidromassagem é divina. Voltarei sempre!"
                  </p>
                  <p className="font-bold font-headline text-foreground">
                    João Pereira
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
