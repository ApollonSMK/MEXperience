"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Hero() {
  return (
    <div className="relative w-full h-screen-minus-header">
      <Carousel className="w-full h-full">
        <CarouselContent>
          {PlaceHolderImages.map((image) => (
            <CarouselItem key={image.id}>
              <div className="relative h-screen-minus-header w-full">
                <Image
                  src={image.imageUrl}
                  alt={image.description}
                  fill
                  style={{ objectFit: "cover" }}
                  data-ai-hint={image.imageHint}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
      </Carousel>
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center text-white p-4">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Le Meilleur du Bien-Être
        </h1>
        <p className="max-w-[700px] text-lg mt-4 md:text-xl">
          Une offre de service innovante pour un soin individuel en toute
          intimité
        </p>
      </div>
    </div>
  );
}