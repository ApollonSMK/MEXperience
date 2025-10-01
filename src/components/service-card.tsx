
import Image from 'next/image';
import type { Service } from '@/lib/services';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { BookingModal } from './booking-modal';

type ServiceCardProps = {
  service: Service;
  image?: ImagePlaceholder;
  className?: string;
};

export default function ServiceCard({
  service,
  image,
  className,
}: ServiceCardProps) {
  return (
    <div
      className={`relative group h-full w-full rounded-lg overflow-hidden ${className}`}
    >
      {image && (
        <Image
          src={image.imageUrl}
          alt={image.description}
          fill
          className="object-cover"
          data-ai-hint={image.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

      <h3 className="absolute top-4 left-4 text-4xl font-headline font-bold text-white">
        {service.name}
      </h3>

      {/* Hover Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"></div>
        <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <service.icon className="w-12 h-12 text-accent mb-4" />
          <h3 className="text-2xl font-headline font-bold mb-2">
            {service.name}
          </h3>
          <p className="text-sm text-gray-200 mb-4 max-w-md">
            {service.longDescription}
          </p>
          <BookingModal serviceId={service.id}>
             <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90"
             >
                Agendar Agora
             </Button>
          </BookingModal>
        </div>
      </div>
    </div>
  );
}
