import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { Button } from "./ui/button";

export function Services() {
  const services = [
    {
      title: "Hydromassage",
      description: "Détendez-vous et soulagez les tensions musculaires grâce à de puissants jets d'eau.",
      imageUrl: PlaceHolderImages.find(p => p.id === '4')?.imageUrl || '',
      imageHint: PlaceHolderImages.find(p => p.id === '4' )?.imageHint || ''
    },
    {
      title: "Collagen Boost",
      description: "Rajeunissez votre peau et boostez la production naturelle de collagène.",
      imageUrl: PlaceHolderImages.find(p => p.id === '5')?.imageUrl || '',
      imageHint: PlaceHolderImages.find(p => p.id === '5' )?.imageHint || ''
    },
    {
      title: "Dôme Infrarouge",
      description: "Détoxifiez votre corps et apaisez votre esprit dans notre dôme infrarouge.",
      imageUrl: PlaceHolderImages.find(p => p.id === '6')?.imageUrl || '',
      imageHint: PlaceHolderImages.find(p => p.id === '6' )?.imageHint || ''
    },
    {
      title: "Banc Solaire",
      description: "Obtenez un bronzage doré parfait dans notre solarium de dernière génération.",
      imageUrl: PlaceHolderImages.find(p => p.id === '7')?.imageUrl || '',
      imageHint: PlaceHolderImages.find(p => p.id === '7' )?.imageHint || ''
    },
  ];

  return (
    <section id="services" className="w-full py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Découvrez nos Soins Exclusifs</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Chaque service est conçu pour votre relaxation et votre régénération, en utilisant les dernières technologies
              pour des résultats visibles.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <Link href="/agendar" key={service.title} className="group block">
              <div className="overflow-hidden rounded-lg bg-card text-card-foreground shadow-sm border transition-shadow duration-300 hover:shadow-lg">
                <div className="aspect-video overflow-hidden">
                  <Image
                    src={service.imageUrl}
                    alt={service.title}
                    width={500}
                    height={300}
                    className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                    data-ai-hint={service.imageHint}
                  />
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-semibold">{service.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{service.description}</p>
                </div>
               </div>
            </Link>
          ))}
        </div>
        <div className="flex justify-center">
            <Button asChild variant="outline">
                <Link href="/agendar">
                    Voir tous les services
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </div>
    </section>
  );
}
