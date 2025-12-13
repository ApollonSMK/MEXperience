"use client";

import { ShieldCheck, Cpu, Car, Coffee, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function WhyChooseUs() {
  const features = [
    {
      title: "Ambiance Exclusive",
      description: "Chaque espace est conçu pour garantir votre confort et votre intimité.",
      icon: ShieldCheck,
    },
    {
      title: "Technologie de Pointe",
      description: "Équipements les plus modernes pour des résultats visibles.",
      icon: Cpu,
    },
    {
      title: "Équipe Professionnelle",
      description: "Spécialistes hautement qualifiés.",
      icon: Users,
    },
    {
      title: "Offres Personnalisées",
      description: "Forfaits sur mesure pour vos besoins.",
      icon: Sparkles,
    },
    {
      title: "Parking Gratuit",
      description: "Parking privé et gratuit.",
      icon: Car,
    },
    {
      title: "Espace Détente",
      description: "Café ou eau offerts.",
      icon: Coffee,
    },
  ];

  return (
    <section id="about" className="w-full py-12 md:py-20 bg-background/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Pourquoi Nous Choisir?</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-lg">
              Nous nous engageons à offrir une expérience de bien-être inégalée.
            </p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center text-center space-y-3 p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="p-3 bg-primary/10 rounded-full mb-1">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}