
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { getServices } from '@/lib/services-db';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BookingModal } from '@/components/booking-modal';
import { Button } from '@/components/ui/button';
import { iconMap } from '@/lib/icon-map';
import type { Service } from '@/lib/services';

export default async function ServicesPage() {
  const services = await getServices();

  const serviceImages = services.reduce(
    (acc, service) => {
      acc[service.id] = PlaceHolderImages.find(
        (img) => img.id === service.imageId
      );
      return acc;
    },
    {} as Record<string, (typeof PlaceHolderImages)[0] | undefined>
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
          Nossos Serviços de Bem-Estar
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Explore nossa gama completa de tratamentos projetados para
          rejuvenescer sua mente, corpo e alma. Cada experiência é adaptada para
          proporcionar o máximo de relaxamento e resultados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {services.map((service) => {
          const serviceImage = serviceImages[service.id];
          const ServiceIcon = iconMap[service.icon as keyof typeof iconMap] || iconMap.default;
          return (
            <Card
              key={service.id}
              className="flex flex-col md:flex-row overflow-hidden border-border group"
            >
              <div className="md:w-1/3 relative h-64 md:h-auto">
                {serviceImage && (
                  <Image
                    src={serviceImage.imageUrl}
                    alt={serviceImage.description}
                    fill
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={serviceImage.imageHint}
                  />
                )}
              </div>
              <div className="md:w-2/3 flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <ServiceIcon className="w-8 h-8 text-accent flex-shrink-0" />
                    <CardTitle className="text-2xl font-headline">
                      {service.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription>{service.longDescription}</CardDescription>
                </CardContent>
                <div className="p-6 pt-0">
                  <BookingModal serviceId={service.id} services={services}>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Agendar {service.name}
                    </Button>
                  </BookingModal>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
