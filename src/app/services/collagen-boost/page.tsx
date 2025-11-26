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

const experienceFeatures = [
    {
        id: "conforto",
        icon: <Timer className="h-8 w-8 text-primary" />,
        title: "Déroulement de la Séance",
        description: "Chaque séance dure 20 minutes et est entièrement automatisée. Allongez-vous confortablement pendant que la technologie LED s'occupe du reste, stimulant votre peau sans douleur ni chaleur excessive.",
        image: "https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Collagen/imgi_286_IMG_1509.jpg",
    },
    {
        id: "tecnologia",
        icon: <Cpu className="h-8 w-8 text-primary" />,
        title: "La Technologie",
        description: "Le Collagen Boost utilise plus de 28 000 LED, combinant 4 longueurs d'onde pour atteindre les couches profondes de la peau. C'est une technologie 100% LED, sans UV, non invasive et sûre pour un usage quotidien.",
        image: "https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Collagen/imgi_185_IMG_1508.jpg",

    },
    {
        id: "programas",
        icon: <SlidersHorizontal className="h-8 w-8 text-primary" />,
        title: "Programmes Disponibles",
        description: "Choisissez parmi plusieurs programmes conçus pour des besoins spécifiques : Anti-Âge, Condition de la Peau, Récupération & Lésions, ou Bien-être Mental.",
        list: ["Anti-Âge", "Condition de la Peau", "Récupération", "Bien-être Mental"],
        image: "https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Collagen/imgi_274_IMG_2318+copy.jpg",
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
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-6xl">Collagen Boost</h1>
            <p className="max-w-3xl mt-4 text-lg md:text-xl">
              Rajeunissement naturel du corps entier grâce à la technologie avancée de la lumière rouge.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/reserver">Réserver une Séance</Link>
            </Button>
          </div>
        </section>

        {/* What is Collagen Boost? */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-xl">
                  <Image
                      src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Collagen/imgi_292_IMG_1514.jpg"
                      alt="Cabine de Collagen Boost"
                      layout="fill"
                      objectFit="cover"
                  />
              </div>
              <div className="space-y-4">
                <h2 className="font-headline text-3xl font-bold tracking-tight">Qu'est-ce que le Collagen Boost ?</h2>
                <p className="text-muted-foreground text-lg">
                  Le Collagen Boost est un traitement de rajeunissement de corps entier basé sur la lumière rouge et infrarouge proche. Cette méthode est 100% naturelle, sans douleur, non invasive et sans produits chimiques.
                </p>
                <p className="text-muted-foreground text-lg">
                  La lumière pénètre jusqu'à 5 mm dans la peau, stimulant les cellules à produire du collagène et de l'élastine naturellement. Le résultat est une peau plus ferme, lumineuse et jeune, pendant que vous vous détendez pendant 20 minutes dans une capsule thérapeutique moderne.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Aesthetic Benefits Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">Bénéfices Esthétiques et Anti-Âge</h2>
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
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Santé, Sport et Récupération</h2>
                     <p className="max-w-3xl mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                        Plus qu'un soin esthétique, un véritable allié pour votre bien-être général.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {healthBenefits.map((benefit) => (
                        <Card key={benefit.title} className="bg-card text-center p-6 border-0 shadow-lg">
                            <CardContent className="flex flex-col items-center gap-4">
                                {benefit.icon}
                                <h3 className="font-headline text-xl font-semibold">{benefit.title}</h3>
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
                    <h2 className="font-headline text-3xl font-bold tracking-tight">Déroulement et Technologie</h2>
                </div>
                 <div className="space-y-12">
                    {experienceFeatures.map((feature, index) => (
                        <div key={feature.id} className={`grid md:grid-cols-2 gap-12 items-center ${index % 2 !== 0 ? 'md:grid-flow-row-dense' : ''}`}>
                            <div className={`relative aspect-video w-full rounded-lg overflow-hidden shadow-xl ${index % 2 !== 0 ? 'md:col-start-2' : ''}`}>
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="space-y-3">
                                
                                <h3 className="font-headline text-2xl font-bold">{feature.title}</h3>
                                <p className="text-muted-foreground">
                                    {feature.description}
                                </p>
                                {feature.list && (
                                     <ul className="list-disc list-inside text-muted-foreground space-y-1 pt-2">
                                        {feature.list.map(item => <li key={item}>{item}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Contraindications Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">À qui s'adresse ce soin ?</h2>
                    <p className="max-w-3xl mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                        Pour garantir votre sécurité et votre confort, veuillez consulter les informations importantes ci-dessous.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="border-destructive/50">
                        <CardContent className="p-6">
                           <div className="flex flex-col items-center text-center">
                                <XCircle className="h-12 w-12 text-destructive mb-4"/>
                                <h3 className="text-xl font-bold text-destructive mb-2">Contre-indications</h3>
                                <p className="text-sm text-muted-foreground mb-4">Utilisation non recommandée. La sécurité avant tout.</p>
                           </div>
                           <div className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2"><XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" /><span>Grossesse</span></div>
                                <div className="flex items-start gap-2"><XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" /><span>Épilepsie photosensible</span></div>
                                <div className="flex items-start gap-2"><XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" /><span>Maladies de la peau sensibles à la lumière</span></div>
                                <div className="flex items-start gap-2"><XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" /><span>Prise de médicaments photosensibilisants</span></div>
                                <div className="flex items-start gap-2"><XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" /><span>Infections cutanées actives</span></div>
                           </div>
                        </CardContent>
                    </Card>
                    <Card className="border-yellow-500/50">
                        <CardContent className="p-6">
                             <div className="flex flex-col items-center text-center">
                                <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4"/>
                                <h3 className="text-xl font-bold text-yellow-600 mb-2">Précautions</h3>
                                <p className="text-sm text-muted-foreground mb-4">Un avis médical est conseillé dans les cas suivants.</p>
                             </div>
                             <div className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" /><span>Diabète non équilibré</span></div>
                                <div className="flex items-start gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" /><span>Problèmes circulatoires sévères</span></div>
                                <div className="flex items-start gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" /><span>Hypotension ou historique de malaises</span></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-green-500/50">
                        <CardContent className="p-6">
                           <div className="flex flex-col items-center text-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4"/>
                                <h3 className="text-xl font-bold text-green-600 mb-2">Recommandé Pour</h3>
                                <p className="text-sm text-muted-foreground mb-4">Idéal si vous cherchez à améliorer les points suivants.</p>
                           </div>
                           <div className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span>Rajeunissement naturel de la peau</span></div>
                                <div className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span>Amélioration de la fermeté et de l'élasticité</span></div>
                                <div className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span>Récupération après l'effort sportif</span></div>
                                <div className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span>Soulagement des douleurs musculaires</span></div>
                                <div className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span>Réduction du stress et amélioration du bien-être</span></div>
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
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-background text-center">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">20 minutes qui transforment votre peau et votre bien-être.</h2>
                <p className="max-w-[600px] mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                    Offrez à votre corps le soin qu'il mérite.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg">
                        <Link href="/reserver">Réserver une Séance Maintenant</Link>
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