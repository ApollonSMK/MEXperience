'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HeartPulse, User, CheckCircle2, XCircle, AlertTriangle, Info, Sparkles, Dna, ShieldCheck, Dumbbell, BrainCircuit, Waves, Star, Thermometer, Music, Sun } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const benefitsInfrared = [
    { text: "Détoxification profonde (élimination des toxines et des métaux lourds)" },
    { text: "Amélioration de la circulation sanguine" },
    { text: "Perte de calories similaire à un exercice" },
    { text: "Réduction des douleurs articulaires et musculaires" },
    { text: "Soulagement de l'inflammation" },
    { text: "Régulation de l'humeur et bien-être émotionnel" },
    { text: "Accélération du métabolisme" },
];

const benefitsRedLight = [
    { text: "Amélioration de l'aspect et de la luminosité de la peau" },
    { text: "Augmentation de la fermeté et de la douceur" },
    { text: "Récupération musculaire plus rapide" },
    { text: "Augmentation de l'énergie cellulaire (ATP)" },
    { text: "Stimulation du collagène et de l'élastine" },
    { text: "Accélération de la cicatrisation" },
];

export default function DomeInfrarougePage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] bg-black text-white">
          <Image
            src="https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/Infrared.png"
            alt="Dôme Infrarouge"
            layout="fill"
            objectFit="cover"
            className="opacity-40"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-6xl">Dôme Infrarouge</h1>
            <p className="max-w-3xl mt-4 text-lg md:text-xl">
              Votre cocon privé de relaxation profonde, régénération et lumière thérapeutique.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/reserver">Réserver une Séance</Link>
            </Button>
          </div>
        </section>

        {/* What is it? */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-xl">
                  <Image
                      src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Dome/imgi_191_Helsi_One_Sauna_full-body-red-light_214e0878-b3bd-44e8-90e8-213f4df86211.webp"
                      alt="Intérieur du Dôme Infrarouge"
                      layout="fill"
                      objectFit="cover"
                  />
              </div>
              <div className="space-y-4">
                <h2 className="font-headline text-3xl font-bold tracking-tight">Qu'est-ce que le Dôme Infrarouge ?</h2>
                <p className="text-muted-foreground text-lg">
                  Le Dôme Infrarouge est un sauna individuel moderne qui offre une expérience de bien-être complète. Il combine trois thérapies puissantes — chaleur par infrarouges lointains, lumière rouge pour le rajeunissement et musique binaurale — pour offrir une relaxation profonde, une détoxification, une régénération de la peau et un soulagement musculaire en une seule séance.
                </p>
                <p className="text-muted-foreground text-lg">
                  C'est un soin non invasif, indolore et très relaxant, idéal pour ceux qui recherchent le rajeunissement, l'équilibre mental et la récupération physique.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Tri-Therapy Explained */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">La Tri-Thérapie Expliquée</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                <Card className="text-center">
                    <CardHeader>
                        <Thermometer className="h-10 w-10 mx-auto text-primary mb-4" />
                        <CardTitle>Chaleur Infrarouge Lointain</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-sm space-y-2">
                        <p>Pénètre de 3,5 à 5 cm sous la peau.</p>
                        <p>Augmente la température corporelle interne de 2–3°C.</p>
                        <p>Aide à la perte calorique, similaire à un exercice léger.</p>
                        <p>Augmente la circulation et l'oxygénation.</p>
                         <p>Soulage les douleurs et les inflammations.</p>
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardHeader>
                        <Sun className="h-10 w-10 mx-auto text-primary mb-4" />
                        <CardTitle>Thérapie par Lumière Rouge</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-sm space-y-2">
                        <p>Pénètre entre 5 mm et 2 cm.</p>
                        <p>Stimule la production naturelle de collagène et d'élastine.</p>
                        <p>Améliore l'élasticité, le tonus, la douceur et la fermeté.</p>
                        <p>Accélère la cicatrisation et la récupération musculaire.</p>
                        <p>Augmente l'énergie cellulaire (ATP).</p>
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardHeader>
                        <Music className="h-10 w-10 mx-auto text-primary mb-4" />
                        <CardTitle>Musique Binaurale Thérapeutique</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-sm space-y-2">
                        <p>Composition exclusive développée pour la relaxation.</p>
                        <p>Induit un état mental de semi-sommeil.</p>
                        <p>Réduit le stress, l'anxiété et la tension mentale.</p>
                        <p>Idéal pour ceux qui souffrent de burnout ou de fatigue.</p>
                    </CardContent>
                </Card>
            </div>
          </div>
        </section>

        {/* New Section: L'Effet sur le Corps */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-4">
                      <h2 className="font-headline text-3xl font-bold tracking-tight">L'Effet sur le Corps</h2>
                      <p className="text-muted-foreground text-lg">
                          Grâce à l'absorption de la radiation infrarouge lointaine, une série de processus se déclenche dans les cellules des tissus, avec les effets suivants :
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-4">
                          <li><strong>Vasodilatation</strong> et augmentation du flux sanguin vers la peau, résultant en un meilleur apport en oxygène et en nutriments pour les tissus.</li>
                          <li>Amélioration de la <strong>fonction des globules blancs</strong> et stimulation du système immunitaire.</li>
                          <li>Amélioration de la <strong>circulation lymphatique</strong>, entraînant l'élimination des toxines accumulées par l'organisme.</li>
                          <li>Amélioration du <strong>métabolisme</strong>.</li>
                          <li>Régulation de l'<strong>hypothalamus</strong>, qui contrôle le sommeil, l'humeur, la douleur et la tension artérielle.</li>
                      </ul>
                  </div>
                  <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-xl">
                      <Image
                          src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Dome/imgi_89_Effect+FIR+on+body.jpg"
                          alt="Effet de l'infrarouge sur le corps"
                          layout="fill"
                          objectFit="contain"
                          className="p-4"
                      />
                  </div>
              </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Avantages pour le Corps et l'Esprit</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Bénéfices de la Chaleur Infrarouge</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {benefitsInfrared.map((benefit, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                                    <p className="text-muted-foreground">{benefit.text}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Bénéfices de la Lumière Rouge</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {benefitsRedLight.map((benefit, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                                    <p className="text-muted-foreground">{benefit.text}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
        
        {/* Contraindications Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">À qui s'adresse ce soin ?</h2>
                    <p className="max-w-3xl mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                        Pour garantir votre sécurité, veuillez consulter les informations importantes ci-dessous.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="border-green-500/50">
                        <CardContent className="p-6">
                           <div className="flex flex-col items-center text-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4"/>
                                <h3 className="text-xl font-bold text-green-600 mb-2">Recommandé Pour</h3>
                           </div>
                           <div className="space-y-3 text-sm text-muted-foreground">
                                <p>Personnes stressées, anxieuses ou fatiguées mentalement.</p>
                                <p>Ceux qui recherchent un soulagement musculaire et articulaire.</p>
                                <p>Personnes souffrant de rétention d'eau ou de toxines.</p>
                                <p>Clients souhaitant améliorer l'aspect de leur peau.</p>
                                <p>Ceux qui recherchent une récupération post-entraînement.</p>
                           </div>
                        </CardContent>
                    </Card>
                    <Card className="border-destructive/50">
                        <CardContent className="p-6">
                           <div className="flex flex-col items-center text-center">
                                <XCircle className="h-12 w-12 text-destructive mb-4"/>
                                <h3 className="text-xl font-bold text-destructive mb-2">Contre-indications</h3>
                           </div>
                           <div className="space-y-3 text-sm text-muted-foreground">
                                <p>Femmes enceintes.</p>
                                <p>Personnes atteintes de maladies cardiaques graves.</p>
                                <p>Hypertension non contrôlée.</p>
                                <p>Conditions médicales sensibles à la chaleur.</p>
                                <p>Infections actives.</p>
                                <p>Épilepsie (en raison de la lumière et du son).</p>
                                <p>Personnes sous médication incompatible avec la chaleur ou la lumière.</p>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tight">Questions Fréquentes</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Combien de temps dure la séance ?</AccordionTrigger>
                        <AccordionContent>
                        Généralement entre 20 et 40 minutes, selon le programme choisi.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Est-ce que ça chauffe trop ?</AccordionTrigger>
                        <AccordionContent>
                        Non. La chaleur est profonde, douce et confortable, jamais excessive.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>Est-ce comme un sauna traditionnel ?</AccordionTrigger>
                        <AccordionContent>
                        Non. C'est une version plus moderne, efficace et douce — sans vapeur et sans température extrême.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>Vais-je être mouillé(e) ?</AccordionTrigger>
                        <AccordionContent>
                        Non, il n'y a pas d'eau. C'est un soin entièrement sec.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-background text-center">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Prêt pour un nouveau niveau de bien-être ?</h2>
                <p className="max-w-xl mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                    Lumière thérapeutique, chaleur profonde et musique zen — tout en une seule séance.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg">
                        <Link href="/reserver">Réserver une Séance</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Disclaimer */}
        <div className="bg-background py-8">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                 <Alert variant="default" className="border-border">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="font-semibold">Avis Légal</AlertTitle>
                  <AlertDescription>
                    Le Dôme Infrarouge est un soin esthétique de bien-être non invasif. Il ne remplace pas un avis médical, ne diagnostique pas et ne traite pas de maladies. En cas de conditions médicales préexistantes, consultez un professionnel de santé.
                  </AlertDescription>
                </Alert>
            </div>
        </div>

      </main>
      <Footer />
    </>
  );
}