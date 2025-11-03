import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShieldCheck, Cpu, Users, Package } from "lucide-react";
import { RetroGrid } from "@/components/ui/retro-grid";

export function WhyChooseUs() {
  const features = [
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: "Ambiente Exclusif",
      description: "Chaque espace est conçu pour garantir votre confort et votre intimité, offrant une atmosphère sereine et privée.",
    },
    {
      icon: <Cpu className="h-10 w-10 text-primary" />,
      title: "Technologie de Pointe",
      description: "Nous utilisons les équipements les plus modernes et les dernières innovations pour des résultats visibles et durables.",
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Équipe Professionnelle",
      description: "Nos experts qualifiés sont à votre écoute pour vous conseiller les meilleurs soins, entièrement adaptés à vos besoins.",
    },
    {
      icon: <Package className="h-10 w-10 text-primary" />,
      title: "Offres Personnalisées",
      description: "Des soins uniques aux forfaits bien-être complets, nous créons des offres exclusives pour une expérience sur mesure.",
    },
  ];

  return (
    <section id="about" className="relative w-full py-12 md:py-16 bg-secondary overflow-hidden">
       <RetroGrid className="opacity-20" />
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Pourquoi Nous Choisir?</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Nous nous engageons à offrir une expérience de bien-être inégalée, alliant luxe, technologie et soins personnalisés.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="flex flex-col items-center text-center p-6 bg-background/80 backdrop-blur-sm border-none shadow-lg rounded-xl">
              <div className="mb-4">{feature.icon}</div>
              <CardTitle className="mb-2 text-xl">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
