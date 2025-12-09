'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, AlertTriangle, Info, Sparkles, Dna, ShieldCheck, Sun, Moon, Ban, HeartPulse, User, Zap, Diamond, Waves, Star, Timer, SlidersHorizontal, Cpu } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const sessionOptions = [
    { icon: <Sun className="h-8 w-8 text-primary"/>, title: "Bronzage Complet", description: "Résultat rapide et uniforme." },
    { icon: <User className="h-8 w-8 text-primary"/>, title: "Visage", description: "Teint plus vif et uniforme." },
    { icon: <Zap className="h-8 w-8 text-primary"/>, title: "Jambes", description: "Idéal pour ceux qui bronzent mal dans cette zone." },
    { icon: <Diamond className="h-8 w-8 text-primary"/>, title: "Séance de Collagène (sans UV)", description: "Peau plus lumineuse et rajeunie." },
    { icon: <Sparkles className="h-8 w-8 text-primary"/>, title: "Séance Hybride", description: "Bronzage plus beau et peau soignée." },
];

const clientBenefits = [
    "Bronzage plus rapide et homogène",
    "Peau à l'aspect plus sain",
    "Moins de sensation de chaleur que les anciens solariums",
    "Séances courtes, sûres et très confortables",
    "Possibilité de choisir la séance idéale pour votre corps",
    "Option sans UV pour ceux qui veulent seulement prendre soin de leur peau",
    "Expérience moderne, élégante et relaxante"
];


export default function BancSolairePage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] bg-black text-white">
          <Image
            src="https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/BancSolaire.png"
            alt="Banc Solaire"
            layout="fill"
            objectFit="cover"
            className="opacity-40"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-6xl">Banc Solaire</h1>
            <p className="max-w-3xl mt-4 text-lg md:text-xl">
                Le bronzage parfait, avec un confort absolu et une technologie moderne.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/reserver">Réserver une Séance</Link>
            </Button>
          </div>
        </section>

        {/* Intro Description */}
        <section className="py-16 md:py-20 bg-background">
             <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
                <p className="text-lg md:text-xl text-muted-foreground">
                    Au M.E Experience, le bronzage n'est pas seulement une couleur — c'est un soin, de l'élégance et du bien-être. Découvrez une expérience solaire premium qui combine une lumière UV de dernière génération avec de la lumière rouge pour une peau plus belle, lumineuse et saine.
                </p>
            </div>
        </section>

        {/* New Gen Experience */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-xl">
                  <Image
                      src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Eva/imgi_28_IMG_6171.jpg"
                      alt="Cabine de Banc Solaire"
                      layout="fill"
                      objectFit="cover"
                  />
              </div>
              <div className="space-y-4">
                <h2 className="font-headline text-3xl font-bold tracking-tight">Une expérience solaire de nouvelle génération</h2>
                <p className="text-muted-foreground text-lg">
                    Le Banc Solaire offre un bronzage uniforme, rapide et confortable, tout en prenant soin de votre peau.
                </p>
                <p className="text-muted-foreground text-lg">
                    Grâce à la technologie avancée de lumière UV et de lumière rouge, le bronzage est plus beau, la peau plus douce et l'expérience beaucoup plus agréable que dans les solariums traditionnels.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Session types */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">Types de Séances Disponibles</h2>
                     <p className="max-w-3xl mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                        Nous adaptons la séance à votre objectif et à votre type de peau.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {sessionOptions.map((option) => (
                        <Card key={option.title} className="p-6 border-0 shadow-md text-center bg-card flex flex-col items-center">
                            {option.icon}
                            <h4 className="font-semibold font-headline text-lg mt-4">{option.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
        
        {/* Client Benefits */}
        <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                 <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">Bénéfices pour Vous</h2>
                </div>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    {clientBenefits.map((benefit, i) => (
                        <div key={i} className="flex flex-col items-center text-center gap-2">
                             <CheckCircle2 className="h-8 w-8 text-primary"/>
                            <p className="font-medium text-muted-foreground">{benefit}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Skin Care Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="md:w-1/2">
                      <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
                        <img 
                          src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Eva/gthtrssdb.png" 
                          alt="Soin de la Peau" 
                          className="object-cover w-full h-full"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                            <p className="text-white font-medium">Une peau radieuse et saine</p>
                         </div>
                      </div>
                    </div>
                    <div className="md:w-1/2 md:pl-12 mt-8 md:mt-0">
                      <h2 className="text-3xl font-light mb-6">Soin de la Peau Pendant le Bronzage</h2>
                        <p className="text-muted-foreground text-lg">
                            La technologie de lumière rouge (collagène) aide à adoucir la peau, à améliorer sa fermeté et à rendre le bronzage plus beau et uniforme.
                        </p>
                         <p className="text-muted-foreground text-lg">
                            Le résultat : un bronzage naturel, radieux et avec une texture plus belle.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* Contraindications Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">À qui s'adresse ce soin ?</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="text-green-500"/>Recommandé Pour</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-muted-foreground">
                            <p>Ceux qui veulent un bronzage rapide avant un événement.</p>
                            <p>Ceux qui recherchent un teint doré naturel toute l'année.</p>
                            <p>Ceux qui n'ont jamais utilisé de solarium et veulent commencer en toute sécurité.</p>
                            <p>Ceux qui ont la peau terne et désirent plus d'éclat.</p>
                            <p>Ceux qui veulent combiner bronzage et rajeunissement de la peau.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-destructive/50 bg-destructive/5">
                        <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><Ban />Contre-indications</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-muted-foreground">
                            <p>Femmes enceintes.</p>
                            <p>Personnes avec un historique de cancer de la peau.</p>
                            <p>Personnes ayant une peau extrêmement sensible au soleil.</p>
                            <p>Personnes prenant des médicaments photosensibilisants.</p>
                            <p className="font-semibold mt-4">En cas de doute, nous pouvons vous aider à évaluer avant la séance.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tight">Questions Fréquentes</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Combien de temps dure le bronzage ?</AccordionTrigger>
                        <AccordionContent>
                        Cela dépend de la peau, mais normalement entre 5 et 10 jours.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Combien de temps dure chaque séance ?</AccordionTrigger>
                        <AccordionContent>
                        Entre 5 et 12 minutes, en fonction de votre type de peau.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>Est-ce que ça fait mal ? Ça brûle ?</AccordionTrigger>
                        <AccordionContent>
                        Non. Les séances sont confortables et régulées pour votre peau.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>Puis-je utiliser uniquement la lumière rouge sans UV ?</AccordionTrigger>
                        <AccordionContent>
                        Oui, via la séance de collagène.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-5">
                        <AccordionTrigger>Faut-il une protection ?</AccordionTrigger>
                        <AccordionContent>
                        Oui, nous fournissons des lunettes de protection.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-secondary/30 text-center">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Prêt(e) pour le bronzage idéal ?</h2>
                <p className="max-w-xl mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                    Élégant, sûr, rapide et totalement personnalisé.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg">
                        <Link href="/reserver">Réserver une Séance</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Disclaimer */}
        <div className="bg-secondary/30 py-8">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                 <Alert variant="default" className="border-border bg-background">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Avis Légal</AlertTitle>
                    <AlertDescription>
                        Le Banc Solaire est un service esthétique de bien-être. Il ne remplace pas un avis médical et ne doit pas être utilisé comme traitement. Consultez un professionnel de santé en cas de doutes ou de conditions spécifiques.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
      </main>
      <Footer />
    </>
  );
}