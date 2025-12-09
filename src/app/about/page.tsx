'use client';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Quote, Sparkles, ArrowRight, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const teamMembers = [
  {
    name: "Fabio Joanaz",
    role: "Co-Fondateur",
    avatar: "https://supabase.me-experience.lu/storage/v1/object/public/images/Team/Sobrenos.jpg",
    bio: "Passionné par le bien-être, Fabio a co-fondé M.E Experience avec la vision de créer un sanctuaire de relaxation et d'innovation.",
  },
  {
    name: "Vera Carvalho",
    role: "Co-Fondatrice",
    avatar: "https://supabase.me-experience.lu/storage/v1/object/public/images/Team/Vera.jpg",
    bio: "Vera est l'autre moitié fondatrice de M.E. Avec son expertise en esthétique, elle a aidé à façonner l'expérience unique que nous offrons.",
  },
  {
    name: "Marcia",
    role: "Manucure & Prothésiste Ongulaire",
    avatar: "https://supabase.me-experience.lu/storage/v1/object/public/images/Team/Marcia.jpeg",
    bio: "Experte en onglerie, Marcia transforme chaque manucure en une œuvre d'art, alliant soin et créativité pour des mains impeccables.",
  },
  {
    name: "Charlène",
    role: "Collaboratrice",
    avatar: "https://supabase.me-experience.lu/storage/v1/object/public/images/Team/Charlene.jpg",
    bio: "Polyvalente et dévouée, Charlène contribue à tous les aspects de notre service pour garantir une expérience client parfaite et fluide.",
  },
  {
    name: "Emmanuelle",
    role: "Collaboratrice",
    avatar: "https://supabase.me-experience.lu/storage/v1/object/public/images/Team/Emmanuelle.jpg",
    bio: "Avec une attention méticuleuse aux détails, Emmanuelle s'assure que chaque client reçoit des soins exceptionnels et personnalisés.",
  },
  {
    name: "Claudia",
    role: "Collaboratrice & Réceptionniste",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop",
    bio: "Claudia est le premier sourire que vous verrez. Elle gère l'accueil et assiste nos spécialistes pour une organisation sans faille.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        {/* Hero Section */}
        <section 
          className="relative w-full h-[50vh] bg-black text-white bg-cover bg-bottom bg-fixed"
          style={{ backgroundImage: `url('https://supabase.me-experience.lu/storage/v1/object/public/images/All/who.png')` }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-6xl">Notre Histoire</h1>
            <p className="max-w-2xl mt-4 text-lg md:text-xl">
              Né d'une passion pour le bien-être et l'innovation.
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="relative py-16 md:py-24">
          <Image
            src="https://supabase.me-experience.lu/storage/v1/object/public/images/All/vision.png"
            alt="Intérieur du spa"
            layout="fill"
            objectFit="cover"
            className="opacity-10 dark:opacity-5"
          />
           <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tight">De la Vision à la Réalité</h2>
              <p className="text-muted-foreground text-lg mt-4">
                M.E Experience a été fondée sur une idée simple : offrir une évasion où la technologie de pointe rencontre le soin personnalisé. Chaque service, chaque espace, a été pensé pour garantir une expérience de bien-être intime et inoubliable, loin de l'agitation du quotidien.
              </p>
              <div className="mt-8 border-t border-border/50 pt-8">
                  <Quote className="h-8 w-8 text-primary mx-auto mb-4" />
                  <p className="text-xl font-semibold italic text-foreground font-headline">
                      Notre mission est de redéfinir la relaxation en offrant une intimité et une efficacité que vous ne trouverez nulle part ailleurs.
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">- Fabio Joanaz & Vera Carvalho, Fondateurs</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Full Experience Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative h-80 md:h-full w-full rounded-lg overflow-hidden shadow-xl order-last md:order-first">
                  <Image
                      src="https://supabase.me-experience.lu/storage/v1/object/public/images/All/who_2211.png"
                      alt="Synergie M.E Experience & M.E Beauty"
                      layout="fill"
                      objectFit="cover"
                  />
              </div>
              <div className="space-y-4">
                <h2 className="font-headline text-3xl font-bold tracking-tight">Une Expérience Complète</h2>
                <p className="text-muted-foreground text-lg">
                  M.E Experience est né de notre désir d'aller plus loin. C'est l'expansion naturelle de notre premier espace, M.E Beauty. Notre objectif ? Créer une synergie unique et offrir des forfaits de services complets qui unissent le meilleur des deux mondes.
                </p>
                <div className="mt-6 border-t pt-6">
                    <h4 className="font-semibold text-lg mb-4 text-center font-headline">La Journée Parfaite</h4>
                    <div className="flex items-center justify-between gap-2 md:gap-4 relative">
                        {/* Step 1: M.E. Beauty */}
                        <div className="flex flex-col items-center text-center w-1/3">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-2 border-2 border-primary/20">
                                <Sparkles className="h-8 w-8 text-primary" />
                            </div>
                            <h5 className="font-bold font-headline">M.E Beauty</h5>
                            <p className="text-xs text-muted-foreground">Laser & HeadSpa</p>
                        </div>

                        {/* Connector */}
                        <div className="flex-1 border-t-2 border-dashed"></div>

                        {/* Step 2: Transition */}
                        <div className="flex flex-col items-center text-center w-auto absolute left-1/2 -translate-x-1/2 bg-secondary/80 p-2 rounded-full">
                           <ArrowRight className="h-6 w-6 text-primary" />
                        </div>

                         <div className="flex-1 border-t-2 border-dashed"></div>

                        {/* Step 3: M.E. Experience */}
                        <div className="flex flex-col items-center text-center w-1/3">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-2 border-2 border-primary/20">
                                <Wind className="h-8 w-8 text-primary" />
                            </div>
                             <h5 className="font-bold font-headline">M.E Experience</h5>
                            <p className="text-xs text-muted-foreground">Hydromassage & Solarium</p>
                        </div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Commencez chez M.E Beauty et traversez simplement la rue pour terminer votre journée de soins chez M.E Experience. Une synergie parfaite pour votre bien-être.
                    </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">Rencontrez Notre Équipe</h2>
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
                        <h3 className="font-headline text-xl font-semibold">{member.name}</h3>
                        <p className="text-primary font-medium">{member.role}</p>
                        <p className="text-sm text-muted-foreground mt-2">{member.bio}</p>
                    </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative w-full py-20 md:py-32 bg-black text-white">
          <Image
            src="https://supabase.me-experience.lu/storage/v1/object/public/images/All/imgi_250_BeautyRED_Room_Interieur_10.png"
            alt="Venez découvrir notre espace"
            layout="fill"
            objectFit="cover"
            className="opacity-40"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <h2 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">Venez Découvrir Notre Espace</h2>
            <p className="max-w-2xl mx-auto mt-4 text-lg text-white/90">
              L'expérience M.E. vous attend. Plongez dans un univers de détente et de soins personnalisés.
            </p>
            <Button asChild size="lg" className="mt-8 bg-white text-black hover:bg-gray-200">
              <Link href="/reserver">Réserver un Soin</Link>
            </Button>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}