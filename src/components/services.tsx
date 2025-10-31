import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Waves, Sparkles, Sun, BedDouble, ArrowRight } from "lucide-react";

export function Services() {
  const services = [
    {
      title: "Hydromassage",
      description: "Détendez-vous et soulagez les tensions musculaires grâce à de puissants jets d'eau.",
      icon: <Waves className="h-8 w-8 text-primary" />,
    },
    {
      title: "Collagen Boost",
      description: "Rajeunissez votre peau et boostez la production naturelle de collagène.",
      icon: <Sparkles className="h-8 w-8 text-primary" />,
    },
    {
      title: "Dôme Infrarouge",
      description: "Détoxifiez votre corps et apaisez votre esprit dans notre dôme infrarouge.",
      icon: <Sun className="h-8 w-8 text-primary" />,
    },
    {
      title: "Banc Solaire",
      description: "Obtenez un bronzage doré parfait dans notre solarium de dernière génération.",
      icon: <BedDouble className="h-8 w-8 text-primary" />,
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
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <Card key={service.title}>
              <CardHeader className="flex flex-col items-center justify-center text-center gap-4">
                {service.icon}
                <div className="grid gap-1">
                  <CardTitle>{service.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>{service.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center">
          <Button variant="default">
            Voir tous les services
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
