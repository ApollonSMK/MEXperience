import Image from 'next/image';
import Link from 'next/link';
import type { Service } from '@/lib/services';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <Card
      className={cn(
        'group flex h-full w-full flex-col overflow-hidden rounded-lg border-border',
        className
      )}
    >
      <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-96">
        {image && (
          <Image
            src={image.imageUrl}
            alt={image.description}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={image.imageHint}
          />
        )}
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-black/80 to-transparent p-6 text-white',
            'translate-y-1/2 transform-gpu transition-transform duration-500 ease-in-out group-hover:translate-y-0'
          )}
        >
          <div className="space-y-4">
            <CardTitle className="font-headline text-3xl">
              {service.name}
            </CardTitle>
            <div className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <CardDescription className="text-white/90">
                {service.longDescription}
              </CardDescription>
              <CardFooter className="mt-4 p-0">
                <Button asChild>
                  <Link href={`/booking?service=${service.id}`}>
                    Agendar Agora
                  </Link>
                </Button>
              </CardFooter>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
