'use client';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const teamMembers = [
  {
    name: "Joana Silva",
    role: "Fondatrice & Esthéticienne",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop",
    bio: "Passionnée par le bien-être, Joana a fondé M.E Experience avec la vision de créer un sanctuaire de relaxation et d'innovation.",
  },
  {
    name: "Marco Lopes",
    role: "Spécialiste Technologie & Soins",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop",
    bio: "Expert en technologies de pointe, Marco s'assure que chaque soin est une expérience unique et efficace.",
  },
  {
    name: "Ana Pereira",
    role: "Responsable Clientèle",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop",
    bio: "Ana est le cœur de notre accueil. Elle veille à ce que chaque visite soit parfaite, du début à la fin.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        {/* Hero Section */}
        <section className="relative w-full h-[50vh] bg-black text-white">
          <Image
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
            alt="Notre histoire"
            layout="fill"
            objectFit="cover"
            className="opacity-40"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl">Notre Histoire</h1>
            <p className="max-w-2xl mt-4 text-lg md:text-xl">
              Né d'une passion pour le bien-être et l'innovation.
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">De la Vision à la Réalité</h2>
                <p className="text-muted-foreground text-lg">
                  M.E Experience a été fondée sur une idée simple : offrir une évasion où la technologie de pointe rencontre le soin personnalisé. Chaque service, chaque espace, a été pensé pour garantir une expérience de bien-être intime et inoubliable, loin de l'agitation du quotidien.
                </p>
                <div className="border-l-4 border-primary pl-4">
                    <Quote className="h-8 w-8 text-primary mb-2" />
                    <p className="text-lg font-semibold italic text-foreground">
                        Notre mission est de redéfinir la relaxation en offrant une intimité et une efficacité que vous ne trouverez nulle part ailleurs.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">- Joana Silva, Fondatrice</p>
                </div>
              </div>
              <div className="relative h-80 md:h-full w-full rounded-lg overflow-hidden shadow-xl">
                <Image
                    src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop"
                    alt="Intérieur du spa"
                    layout="fill"
                    objectFit="cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24 bg-secondary/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Rencontrez Notre Équipe</h2>
              <p className="max-w-3xl text-muted-foreground md:text-xl">
                Une équipe de professionnels passionnés, dédiés à votre bien-être.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <Card key={member.name} className="text-center overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <Avatar className="w-28 h-28 mx-auto mb-4 border-4 border-primary/20">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-semibold">{member.name}</h3>
                        <p className="text-primary font-medium">{member.role}</p>
                        <p className="text-sm text-muted-foreground mt-2">{member.bio}</p>
                    </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
