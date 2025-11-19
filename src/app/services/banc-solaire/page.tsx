'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HeartPulse, User, CheckCircle2, XCircle, AlertTriangle, Info, Sparkles, Dna, ShieldCheck, Dumbbell, BrainCircuit, Waves, Star, Diamond, Zap, Timer, SlidersHorizontal, Cpu, Sun, Moon, Ban } from 'lucide-react';

const versions = [
    {
        title: "EVA HYBRID",
        subtitle: "Technologie Hybride (UV + Lumière Rouge + DNA Light)",
        description: "Combinaison parfaite de LED UV et de lampes DNA pour un bronzage uniforme et intense, tout en prenant soin de la peau avec du collagène. Économie d'énergie supérieure à 75 % pour une peau plus tonique, douce et lumineuse."
    },
    {
        title: "EVA LED",
        subtitle: "100% Technologie LED",
        description: "L'équipement le plus avancé de la gamme, offrant des sessions 100% LED UV ou 100% lumière rouge. Il assure une consommation d'énergie réduite, un bronzage plus efficace avec moins de chaleur, et une option hybride est disponible."
    },
    {
        title: "EVA NATURAL",
        subtitle: "Fluorescent Traditionnel Moderne",
        description: "Une solution économique avec de hautes performances, disponible avec des lampes UV ou de lumière rouge. Son design moderne est entièrement personnalisable, idéal pour ceux qui recherchent un excellent résultat à un coût avantageux."
    }
];

const sessionOptions = [
    { title: "Session Complète", description: "Tout le système est actif pour un bronzage intégral." },
    { title: "Only Face", description: "Concentration sur le visage pour un teint parfait." },
    { title: "Only Legs", description: "Session ciblée pour des jambes magnifiquement bronzées." },
    { title: "Seulement Collagène LED", description: "Une séance de rajeunissement sans UV pour revitaliser la peau." },
    { title: "Session Hybride", description: "Combine bronzage et collagène pour des bienfaits décuplés." },
];

const lightBenefits = [
    { icon: <Sun className="h-6 w-6 text-primary" />, type: "UVB", description: "Stimule la production de mélanine et aide à la production de vitamine D." },
    { icon: <Sun className="h-6 w-6 text-yellow-500" />, type: "UVA", description: "Offre un bronzage direct, rapide et plus intense." },
    { icon: <Sparkles className="h-6 w-6 text-blue-400" />, type: "Lumière Bleue", description: "Purifie la peau, améliore sa texture et réduit les imperfections." },
    { icon: <HeartPulse className="h-6 w-6 text-red-500" />, type: "Lumière Rouge (Collagène)", description: "Rajeunit, lisse les ridules, améliore la fermeté et l'éclat pour un bronzage plus uniforme." },
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
              Bronzage élégant, sûr et moderne — avec la technologie la plus avancée du marché.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/agendar">Réserver une Séance</Link>
            </Button>
          </div>
        </section>

        {/* What is Banc Solaire? */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-xl">
                  <Image
                      src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/BancSolaire/banc_solaire_1.jpg"
                      alt="Cabine de Banc Solaire"
                      layout="fill"
                      objectFit="cover"
                  />
              </div>
              <div className="space-y-4">
                <h2 className="font-headline text-3xl font-bold tracking-tight">Qu'est-ce que le Banc Solaire ?</h2>
                <p className="text-muted-foreground text-lg">
                  Le Banc Solaire est un solarium premium de nouvelle génération qui allie design élégant, technologie LED avancée et personnalisation totale.
                </p>
                <p className="text-muted-foreground text-lg">
                  Il permet un bronzage plus homogène, efficace et avec une consommation d'énergie bien moindre, offrant une expérience de luxe qui combine lumière UV, lumière rouge (collagène) et technologie hybride. Idéal pour ceux qui recherchent un bronzage naturel, lumineux et sûr, sans sacrifier le confort et l'esthétique.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Three Versions Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">Les Trois Versions Disponibles</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {versions.map((version) => (
                        <Card key={version.title} className="text-center p-6 border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">{version.title}</CardTitle>
                                <p className="text-sm text-primary font-medium">{version.subtitle}</p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">{version.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Session Options & Benefits Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-16 items-start">
                <div>
                    <h2 className="font-headline text-3xl font-bold tracking-tight mb-8">Options de Séance</h2>
                    <div className="space-y-4">
                        {sessionOptions.map((option) => (
                            <Card key={option.title} className="p-4">
                                <h4 className="font-semibold">{option.title}</h4>
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                            </Card>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="font-headline text-3xl font-bold tracking-tight mb-8">Bénéfices de la Technologie</h2>
                    <div className="space-y-4">
                        {lightBenefits.map((benefit) => (
                            <div key={benefit.type} className="flex items-start gap-4">
                                {benefit.icon}
                                <div>
                                    <h4 className="font-semibold">{benefit.type}</h4>
                                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                </div>
                            </div>
                        ))}
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
                    <Card className="border-green-500/50">
                        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="text-green-500"/>Recommandé Pour</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-muted-foreground">
                            <p>Personnes désirant un bronzage sain et élégant.</p>
                            <p>Ceux qui cherchent un bronzage rapide avant des événements.</p>
                            <p>Clients avec une peau terne et sans éclat.</p>
                            <p>Ceux qui veulent combiner bronzage et soins de la peau.</p>
                            <p>Personnes cherchant une alternative moderne aux solariums traditionnels.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-destructive/50">
                        <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><Ban />Contre-indications</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-muted-foreground">
                            <p>Femmes enceintes.</p>
                            <p>Personnes avec un mélanome ou une suspicion de cancer de la peau.</p>
                            <p>Problèmes dermatologiques photosensibles.</p>
                            <p>Personnes sous médication photosensibilisante.</p>
                            <p>Personnes présentant des brûlures récentes.</p>
                            <p className="font-semibold mt-4">En cas de doute, consultez un professionnel de santé.</p>
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
                        <AccordionTrigger>Combien de temps dure une séance ?</AccordionTrigger>
                        <AccordionContent>
                        Varie entre 5 et 15 minutes, selon le type de séance.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Est-ce que ça fait mal ?</AccordionTrigger>
                        <AccordionContent>
                        Non. C'est confortable et adapté à votre type de peau.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>Combien de temps dure le bronzage ?</AccordionTrigger>
                        <AccordionContent>
                        Généralement de 5 à 10 jours, selon le type de peau et les soins post-séance.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>Puis-je utiliser uniquement la lumière rouge sans UV ?</AccordionTrigger>
                        <AccordionContent>
                        Oui, via la séance "Seulement Collagène".
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-5">
                        <AccordionTrigger>Est-ce sûr ?</AccordionTrigger>
                        <AccordionContent>
                        Oui, à condition de suivre le protocole d'utilisation et de respecter les contre-indications.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-secondary/30 text-center">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Prêt(e) pour un bronzage parfait ?</h2>
                <p className="max-w-xl mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                    Technologie LED, collagène et UV — tout en une expérience personnalisée.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg">
                        <Link href="/agendar">Réserver une Séance</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Disclaimer */}
        <div className="bg-background py-8">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border">
                    <Info className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                        Le Banc Solaire est un équipement esthétique de bien-être. Il ne remplace pas un avis médical, ne diagnostique pas de maladies et ne doit pas être utilisé comme traitement médical. En cas de conditions spécifiques, veuillez demander l'avis d'un professionnel de santé.
                    </p>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
