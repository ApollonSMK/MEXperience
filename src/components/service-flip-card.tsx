import Image from 'next/image';
import Link from 'next/link';
import type { Service } from '@/lib/services';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';

type ServiceFlipCardProps = {
  service: Service;
  image?: ImagePlaceholder;
  className?: string;
};

export default function ServiceFlipCard({
  service,
  image,
  className,
}: ServiceFlipCardProps) {
  return (
    <div className={`flip-card rounded-lg overflow-hidden ${className}`}>
      <div className="flip-card-inner rounded-lg">
        {/* Card Front */}
        <div className="flip-card-front">
          {image && (
            <Image
              src={image.imageUrl}
              alt={image.description}
              fill
              className="object-cover"
              data-ai-hint={image.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-black/20" />
          <h3 className="absolute top-4 left-4 text-4xl font-headline font-bold text-white">
            {service.name}
          </h3>
        </div>

        {/* Card Back */}
        <div className="flip-card-back bg-card border text-card-foreground p-6 flex flex-col justify-center items-center">
          <service.icon className="w-12 h-12 text-accent mb-4" />
          <h3 className="text-2xl font-headline font-bold mb-2">
            {service.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {service.longDescription}
          </p>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href={`/booking?service=${service.id}`}>Agendar Agora</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
