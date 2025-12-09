'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import type { Service as ServiceType } from '@/app/admin/services/page';

const createSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}

export function Services() {
  const supabase = getSupabaseBrowserClient();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('order');
      
      if (error) {
        console.error('Error fetching services:', error);
      } else {
        setServices(data as ServiceType[] || []);
      }
      setIsLoading(false);
    };

    fetchServices();
  }, [supabase]);

  const serviceImages: { [key: string]: string } = {
    'Hydromassage': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/Hydro.png',
    'Collagen Boost': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/CollagenBoost.png',
    'Dôme Infrarouge': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/Infrared.png',
    'Banc Solaire': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/BancSolaire.png'
  };

  return (
    <section 
      id="services" 
      className="relative w-full py-12 md:py-16 bg-background"
    >
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Découvrez nos soins exclusifs</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Chaque service est conçu pour votre relaxation et votre régénération, en utilisant les dernières technologies
              pour des résultats visibles.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="flex flex-col bg-background">
                    <Skeleton className="aspect-video w-full" />
                    <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            ))
          ) : (
            services.map((service) => (
              <Link href={`/services/${createSlug(service.name)}`} key={service.id} className="group block">
                <div className="overflow-hidden rounded-lg bg-background text-card-foreground shadow-lg border transition-shadow duration-300 hover:shadow-xl h-full flex flex-col">
                  <div className="aspect-video overflow-hidden relative">
                    <Image
                      src={serviceImages[service.name] || `https://picsum.photos/seed/${service.id}/500/300`}
                      alt={service.name}
                      fill
                      className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 flex-grow">
                      <h3 className="font-headline text-xl font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground mt-2">{service.description}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="flex justify-center">
            <Button asChild>
                <Link href="/services">
                    Voir tous les services
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </div>
    </section>
  );
}