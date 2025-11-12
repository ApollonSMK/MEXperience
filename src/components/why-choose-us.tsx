
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShieldCheck, Cpu, Car, Coffee, Users, Sparkles } from "lucide-react";
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
      description: "Nos spécialistes sont hautement qualifiés et dédiés à offrir un service exceptionnel et des conseils personnalisés.",
    },
    {
      icon: <Sparkles className="h-10 w-10 text-primary" />,
      title: "Offres Personnalisées",
      description: "Nous créons des forfaits sur mesure qui combinent nos meilleurs services pour répondre à vos besoins uniques.",
    },
    {
      icon: <Car className="h-10 w-10 text-primary" />,
      title: "Parque Gratuito",
      description: "Profitez de notre parking privé et gratuit. Garez-vous facilement et commencez votre expérience sans stress.",
    },
    {
      icon: <Coffee className="h-10 w-10 text-primary" />,
      title: "Espace Détente",
      description: "Détendez-vous avant ou après votre soin. Nous vous offrons un café ou de l'eau dans notre espace de courtoisie.",
    },
  ];

  return (
    <section id="about" className="relative w-full py-12 md:py-16 bg-background overflow-hidden">
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
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="bg-background p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center text-center">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
