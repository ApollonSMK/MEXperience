"use client";

import Image from "next/image";
import Link from "next/link";
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
import { ImageIcon } from "lucide-react";
import { Button } from "./ui/button";

interface HeroImage {
  id: string;
  image_url: string;
  alt_text: string;
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
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
        .select('id, image_url, alt_text, title, subtitle, button_text, button_link')
        .order('display_order');
      
      if (error) {
        console.error("Error fetching hero images:", error);
        setImages([]);
      } else {
        setImages(data as HeroImage[] || []);
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
            {images.length > 0 ? images.map((image, index) => (
              <CarouselItem key={image.id}>
                <div className="relative h-[calc(100vh-3.5rem)] w-full">
                  <Image
                    src={image.image_url}
                    alt={image.alt_text}
                    fill
                    style={{ objectFit: "cover" }}
                    priority={index === 0} // Priority for first image
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-center text-center text-white p-4 sm:p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                        {image.title || "Le Meilleur du Bien-Être"}
                      </h1>
                      <p className="max-w-[700px] text-lg mt-4 md:text-xl">
                        {image.subtitle || "Une offre de service innovante pour un soin individuel en toute intimité"}
                      </p>
                      {image.button_text && image.button_link && (
                        <Button asChild className="mt-6" size="lg">
                          <Link href={image.button_link}>{image.button_text}</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            )) : (
              <CarouselItem>
                 <div className="relative h-[calc(100vh-3.5rem)] w-full bg-muted flex flex-col items-center justify-center text-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">Nenhuma Imagem de Herói Configurada</h3>
                    <p className="text-muted-foreground mt-2">Vá ao painel de administração para adicionar imagens ao carrossel.</p>
                 </div>
              </CarouselItem>
            )}
          </CarouselContent>
          {images.length > 1 && (
            <>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden sm:inline-flex" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden sm:inline-flex" />
            </>
          )}
        </Carousel>
      )}
       <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}
