"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import Autoplay from "embla-carousel-autoplay";

interface HeroImage {
  id: string;
  image_url: string;
  alt_text: string;
}

export function Hero() {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  );
  const supabase = getSupabaseBrowserClient();
  const [images, setImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hero_images')
        .select('id, image_url, alt_text')
        .order('display_order');
      
      if (error) {
        console.error("Error fetching hero images:", error);
        setImages([]);
      } else {
        setImages(data || []);
      }
      setIsLoading(false);
    };

    fetchImages();
  }, [supabase]);

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)]">
      {isLoading ? (
        <Skeleton className="w-full h-full" />
      ) : (
        <Carousel 
          className="w-full h-full"
          plugins={[plugin.current]}
          opts={{ loop: true }}
        >
          <CarouselContent>
            {images.length > 0 ? images.map((image) => (
              <CarouselItem key={image.id}>
                <div className="relative h-[calc(100vh-3.5rem)] w-full">
                  <Image
                    src={image.image_url}
                    alt={image.alt_text}
                    fill
                    style={{ objectFit: "cover" }}
                    priority
                  />
                </div>
              </CarouselItem>
            )) : (
              <CarouselItem>
                 <div className="relative h-[calc(100vh-3.5rem)] w-full bg-muted flex items-center justify-center">
                   <p className="text-muted-foreground">Nenhuma imagem configurada</p>
                 </div>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
        </Carousel>
      )}
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center text-white p-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Le Meilleur du Bien-Être
        </h1>
        <p className="max-w-[700px] text-lg mt-4 md:text-xl">
          Une offre de service innovante pour un soin individuel en toute
          intimité
        </p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
