import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Services() {
  const services = [
    {
      title: "Hydromassage",
      description: "Détendez-vous et soulagez les tensions musculaires grâce à de puissants jets d'eau.",
      imageUrl: PlaceHolderImages.find(p => p.id === '4')?.imageUrl || '',
      imageHint: PlaceHolderImages.find(p => p.id === '4')?.imageHint || ''
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
      imageHint: PlaceHolderImages.find(p => p.id === '6')?.imageHint || ''
    },
    {
      title: "Banc Solaire",
      description: "Obtenez un bronzage doré parfait dans notre solarium de dernière génération.",
      imageUrl: PlaceHolderImages.find(p => p.id === '7')?.imageUrl || '',
      imageHint: PlaceHolderImages.find(p => p.id === '7')?.imageHint || ''
    },
  ];

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
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
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-12 sm:grid-cols-2 md:grid-cols-4">
          {services.map((service) => (
            <Card key={service.title} className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <Image
                src={service.imageUrl}
                alt={service.title}
                width={600}
                height={400}
                className="w-full h-auto object-cover aspect-[4/3]"
                data-ai-hint={service.imageHint}
              />
              <div className="p-6">
                <CardTitle>{service.title}</CardTitle>
                <CardContent className="p-0 pt-2">
                  <CardDescription>{service.description}</CardDescription>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
        <div className="flex justify-center">
          <Button variant="outline">
            Voir tous les services
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
