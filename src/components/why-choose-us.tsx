"use client";

import { ShieldCheck, Cpu, Car, Coffee, Users, Sparkles } from "lucide-react";
import { RetroGrid } from "@/components/ui/retro-grid";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { motion } from "framer-motion";

export function WhyChooseUs() {
  const features = [
    {
      title: "Ambiente Exclusif",
      description: "Chaque espace est conçu pour garantir votre confort et votre intimité.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800" />,
      icon: <ShieldCheck className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-2",
    },
    {
      title: "Technologie de Pointe",
      description: "Équipements les plus modernes pour des résultats visibles.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800" />,
      icon: <Cpu className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-1",
    },
     {
      title: "Équipe Professionnelle",
      description: "Spécialistes hautement qualifiés.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800" />,
      icon: <Users className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-1",
    },
    {
      title: "Offres Personnalisées",
      description: "Forfaits sur mesure pour vos besoins.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800" />,
      icon: <Sparkles className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-2",
    },
    {
      title: "Parking Gratuit",
      description: "Parking privé et gratuit.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800" />,
      icon: <Car className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-1",
    },
    {
      title: "Espace Détente",
      description: "Café ou eau offerts.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800" />,
      icon: <Coffee className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-2", // Make this one wider for visual balance if desired, or keep as 1
    },
  ];

  return (
    <section id="about" className="relative w-full py-12 md:py-24 bg-background overflow-hidden">
       <RetroGrid className="opacity-20" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Pourquoi Nous Choisir?</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
              Nous nous engageons à offrir une expérience de bien-être inégalée.
            </p>
          </motion.div>
        </div>
        
        <BentoGrid>
          {features.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={item.className}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}