'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Service as ServiceType, PricingTier } from '@/app/admin/services/page';

const serviceImages: { [key: string]: string } = {
  'Hydromassage': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/Hydro.png',
  'Collagen Boost': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/CollagenBoost.png',
  'Dôme Infrarouge': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/Infrared.png',
  'Banc Solaire': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/BancSolaire.png'
};

const getMinPrice = (pricingTiers: PricingTier[]) => {
    if (!pricingTiers || pricingTiers.length === 0) {
        return 0;
    }
    return Math.min(...pricingTiers.map(tier => tier.price));
}

const createSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}

export function ServicesView() {
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

  return (
      <main className="flex-grow bg-background">
        
        <section className="relative w-full h-[50vh] bg-black">
          <Image
            src="https://supabase.me-experience.lu/storage/v1/object/public/images/All/imgi_127_shutterstock_640013521+copy.jpg"
            alt="Nos Soins et Services"
            layout="fill"
            objectFit="cover"
            className="opacity-40"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-6xl">Nos Soins et Services</h1>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Explorez notre gamme complète de soins conçus pour votre bien-être. Chaque service est une expérience unique.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex flex-col space-y-3">
                    <Skeleton className="h-[225px] w-full rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-10 w-1/2" />
                    </div>
                  </div>
                ))
              ) : services.length > 0 ? (
                services.map((service) => (
                  <div key={service.id} className="group relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 ease-in-out hover:!scale-105">
                     <Link href={`/services/${createSlug(service.name)}`} className="absolute inset-0 z-10">
                        <span className="sr-only">View</span>
                     </Link>
                    <Image
                      src={serviceImages[service.name] || `https://picsum.photos/seed/${service.id}/600/400`}
                      alt={service.name}
                      width={600}
                      height={400}
                      className="object-cover w-full h-60"
                    />
                    <div className="bg-background p-6">
                      <h3 className="text-2xl font-bold">{service.name}</h3>
                      <p className="text-muted-foreground mt-2 h-24 overflow-hidden">{service.description}</p>
                      <div className="flex items-center justify-between mt-4">
                        <div>
                            <p className="text-sm text-muted-foreground">À partir de</p>
                            <p className="text-lg font-semibold">€{getMinPrice(service.pricing_tiers).toFixed(2)}</p>
                        </div>
                        <Button asChild variant="default" size="lg" className="z-20 relative">
                            <Link href={`/services/${createSlug(service.name)}`}>
                                Découvrir
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-16">
                    <Info className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Aucun service disponible</h3>
                    <p className="mt-2 text-sm">Veuillez vérifier ultérieurement ou contacter le support.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
  );
}