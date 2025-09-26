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
        'group flex h-full w-full flex-col overflow-hidden rounded-lg border-transparent bg-transparent shadow-none',
        className
      )}
    >
      <div className="relative h-64 w-full overflow-hidden rounded-t-lg">
        {image && (
          <Image
            src={image.imageUrl}
            alt={image.description}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={image.imageHint}
          />
        )}
      </div>
      <CardHeader>
        <div className="flex items-center gap-3">
          <service.icon className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
          <CardTitle className="font-headline text-2xl text-muted-foreground transition-colors group-hover:text-primary">
            {service.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>{service.longDescription}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/booking?service=${service.id}`}>Agendar Agora</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
