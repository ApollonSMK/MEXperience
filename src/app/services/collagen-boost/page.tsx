'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HeartPulse, User, CheckCircle2, XCircle, AlertTriangle, Info, Sparkles, Dna, ShieldCheck, Dumbbell, BrainCircuit, Waves, Star, Diamond, Zap, Timer, SlidersHorizontal, Cpu } from 'lucide-react';

const estheticBenefits = [
    { icon: <Sparkles className="h-6 w-6 text-primary" />, text: "Réduction des rides et des lignes fines" },
    { icon: <Zap className="h-6 w-6 text-primary" />, text: "Peau plus ferme, élastique et lumineuse" },
    { icon: <ShieldCheck className="h-6 w-6 text-primary" />, text: "Réduction des rougeurs et de l'hyperpigmentation" },
    { icon: <Star className="h-6 w-6 text-primary" />, text: "Amélioration des taches sombres et des cernes" },
    { icon: <Waves className="h-6 w-6 text-primary" />, text: "Amélioration des vergetures" },
    { icon: <Diamond className="h-6 w-6 text-primary" />, text: "Texture plus douce et uniforme" },
    { icon: <Dna className="h-6 w-6 text-primary" />, text: "Pores plus purifiés" },
    { icon: <User className="h-6 w-6 text-primary" />, text: "Apparence plus jeune et saine" },
];

const healthBenefits = [
    {
        icon: <HeartPulse className="h-8 w-8 text-primary" />,
        title: "Soulagement des Douleurs",
        description: "Soulage les douleurs musculaires et articulaires grâce à ses propriétés anti-inflammatoires."
    },
    {
        icon: <Dumbbell className="h-8 w-8 text-primary" />,
        title: "Récupération Sportive",
        description: "Accélère la récupération après l'effort physique et améliore l'oxygénation des tissus."
    },
    {
        icon: <BrainCircuit className="h-8 w-8 text-primary" />,
        title: "Bien-être Mental",
        description: "Stimule la sérotonine, procurant une sensation de bien-être physique et mental."
    },
    {
        icon: <Waves className="h-8 w-8 text-primary" />,
        title: "Circulation et Cicatrisation",
        description: "Améliore la circulation sanguine et favorise une meilleure cicatrisation des tissus."
    }
];

export default function CollagenBoostPage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] bg-black text-white">
          <Image
            src="https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/CollagenBoost.png"
            alt="Collagen Boost"
            layout="fill"
            objectFit="cover"
            className="opacity-40"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl">Collagen Boost</h1>
            <p className="max-w-3xl mt-4 text-lg md:text-xl">
              Rejuvenescimento natural de corpo inteiro através de tecnologia avançada de luz vermelha.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/agendar">Réserver une Séance</Link>
            </Button>
          </div>
        </section>

        {/* What is Collagen Boost? */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-xl">
                  <Image
                      src="https://images.unsplash.com/photo-1634393654264-10f278c18bcd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8Y29sbGFnZW4lMjBiZWR8ZW58MHx8fHwxNzYxOTM2MTgwfDA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Cabine de Collagen Boost"
                      layout="fill"
                      objectFit="cover"
                  />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Qu'est-ce que le Collagen Boost ?</h2>
                <p className="text-muted-foreground text-lg">
                  Le Collagen Boost est un traitement de rajeunissement de corps entier basé sur la lumière rouge et infrarouge proche. Cette méthode est 100% naturelle, sans douleur, non invasive et sans produits chimiques.
                </p>
                <p className="text-muted-foreground text-lg">
                  La lumière pénètre jusqu'à 5 mm dans la peau, stimulant les cellules à produire naturellement du collagène et de l'élastine. Le résultat est une peau plus ferme, lumineuse et jeune, pendant que vous vous détendez pendant 20 minutes dans une capsule thérapeutique moderne.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Aesthetic Benefits Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Bénéfices Esthétiques et Anti-Âge</h2>
              <p className="max-w-3xl mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                Une transformation visible pour une peau visiblement plus jeune et éclatante de santé.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 max-w-5xl mx-auto">
              {estheticBenefits.map((benefit) => (
                <div key={benefit.text} className="flex items-start space-x-3">
                  {benefit.icon}
                  <p className="font-medium text-muted-foreground">{benefit.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Health & Sports Benefits Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Santé, Sport et Récupération</h2>
                     <p className="max-w-3xl mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                        Plus qu'un soin esthétique, un véritable allié pour votre bien-être général.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {healthBenefits.map((benefit) => (
                        <Card key={benefit.title} className="bg-card text-center p-6 border-0 shadow-lg">
                            <CardContent className="flex flex-col items-center gap-4">
                                {benefit.icon}
                                <h3 className="text-xl font-semibold">{benefit.title}</h3>
                                <p className="text-muted-foreground text-sm">{benefit.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
        
        {/* How it works */}
        <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">Déroulement et Technologie</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8 items-start">
                    <Card className="flex flex-col items-center text-center p-6">
                        <Timer className="h-10 w-10 text-primary mb-4" />
                        <CardTitle className="text-xl mb-2">Déroulement de la Séance</CardTitle>
                        <CardContent className="text-sm text-muted-foreground">
                            Chaque séance dure 20 minutes et est entièrement automatisée. Allongez-vous confortablement pendant que la technologie LED s'occupe du reste, stimulant votre peau sans douleur ni chaleur excessive.
                        </CardContent>
                    </Card>
                    <Card className="flex flex-col items-center text-center p-6">
                        <Cpu className="h-10 w-10 text-primary mb-4" />
                        <CardTitle className="text-xl mb-2">La Technologie</CardTitle>
                        <CardContent className="text-sm text-muted-foreground">
                            Le Collagen Boost utilise plus de 28 000 LED, combinant 4 longueurs d'onde pour atteindre les couches profondes de la peau. C'est une technologie 100% LED, sans UV, non invasive et sûre pour un usage quotidien.
                        </CardContent>
                    </Card>
                    <Card className="flex flex-col items-center text-center p-6">
                        <SlidersHorizontal className="h-10 w-10 text-primary mb-4" />
                        <CardTitle className="text-xl mb-2">Programmes Disponibles</CardTitle>
                        <CardContent className="text-sm text-muted-foreground">
                            <ul className="list-none space-y-1">
                                <li>Anti-Âge</li>
                                <li>Condition de la Peau</li>
                                <li>Récupération</li>
                                <li>Bien-être Mental</li>
                            </ul>
                        </CardContent>
                    </Card>
                 </div>
            </div>
        </section>

        {/* Recommendations Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">À qui s'adresse ce soin ?</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" /><span>Pour ceux qui recherchent un rajeunissement naturel.</span></div>
                    <div className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" /><span>Pour les peaux manquant de fermeté ou de luminosité.</span></div>
                    <div className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" /><span>Pour améliorer la texture et la fermeté de la peau.</span></div>
                    <div className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" /><span>Pour les sportifs en phase de récupération musculaire.</span></div>
                    <div className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" /><span>Pour les personnes souffrant de stress et de fatigue mentale.</span></div>
                    <div className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" /><span>Pour améliorer la cicatrisation ou réduire l'inflammation.</span></div>
                </div>
            </div>
        </section>

        {/* Contraindications & FAQ Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-12">
                     <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-6">Contre-indications</h2>
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-8 w-8 text-destructive"/>
                                    <CardTitle className="text-destructive">Non Recommandé</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-muted-foreground">
                                <p>Pour votre sécurité, ce soin est déconseillé si vous présentez l'une des conditions suivantes :</p>
                               <ul className="list-disc list-inside pl-4">
                                  <li>Grossesse</li>
                                  <li>Épilepsie photosensible</li>
                                  <li>Maladies de la peau sensibles à la lumière</li>
                                  <li>Prise de médicaments photosensibilisants</li>
                                  <li>Infections cutanées actives</li>
                                </ul>
                                <p className="pt-2 text-sm">En cas de doute, il est recommandé de consulter un professionnel de santé.</p>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-6">Questions Fréquentes</h2>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Est-ce sûr ?</AccordionTrigger>
                                <AccordionContent>
                                Oui. La thérapie LED est utilisée depuis des décennies en esthétique et en physiothérapie. Elle ne contient aucun rayon UV.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Est-ce que ça fait mal ?</AccordionTrigger>
                                <AccordionContent>
                                Non. C'est un traitement totalement indolore, confortable et relaxant.
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-3">
                                <AccordionTrigger>Quand verrai-je des résultats ?</AccordionTrigger>
                                <AccordionContent>
                                Beaucoup de clients remarquent des améliorations dès les premières séances. Les meilleurs résultats apparaissent généralement entre 8 et 12 séances.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger>Puis-je l'utiliser tous les jours ?</AccordionTrigger>
                                <AccordionContent>
                                Oui, à condition que vous ne présentiez aucune contre-indication.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-background text-center">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">20 minutes qui transforment votre peau et votre bien-être.</h2>
                <p className="max-w-[600px] mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                    Offrez à votre corps le soin qu'il mérite.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg">
                        <Link href="/agendar">Réserver une Séance Maintenant</Link>
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
                        Le Collagen Boost est un traitement esthétique non invasif basé sur la lumière LED. Il ne remplace pas un avis ou un diagnostic médical. Les personnes ayant des conditions médicales préexistantes doivent consulter un professionnel de santé avant utilisation.
                    </p>
                 </div>
            </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
