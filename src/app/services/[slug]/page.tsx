'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { HeartPulse, Waves, Leaf, Wind, Info, CheckCircle2, UserCheck, Timer, SlidersHorizontal, Users, BrainCircuit, Dumbbell, ShieldCheck, Star, Ban, AlertTriangle, Coffee, Car, Cpu, Droplets, Bed, Lock, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import type { Service as ServiceType, PricingTier } from '@/app/admin/services/page';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as pixel from '@/lib/fpixel';
import { motion } from 'framer-motion';

const serviceImages: { [key: string]: string } = {
  'Hydromassage': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/Hydro.png',
  'Collagen Boost': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/CollagenBoost.png',
  'Dôme Infrarouge': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/Infrared.png',
  'Banc Solaire': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/BancSolaire.png'
};

const createSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const [service, setService] = useState<ServiceType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug || !supabase) return;

    const fetchService = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*');

      if (error) {
        console.error('Error fetching service:', error);
        setIsLoading(false);
        return;
      }
      
      const allServices = data as ServiceType[];
      const currentService = allServices.find(s => createSlug(s.name) === slug);
      
      if (currentService) {
        if (currentService.name === 'Collagen Boost') {
          router.replace('/services/collagen-boost');
          return;
        }
        if (currentService.name === 'Dôme Infrarouge') {
          router.replace('/services/dome-infrarouge');
          return;
        }
        if (currentService.name === 'Banc Solaire') {
          router.replace('/services/banc-solaire');
          return;
        }
        setService(currentService);
        
        // Track ViewContent
        pixel.event('ViewContent', {
            content_name: currentService.name,
            content_ids: [currentService.id],
            content_type: 'product',
            value: currentService.pricing_tiers?.[0]?.price || 0,
            currency: 'EUR'
        });

      } else {
        setService(null);
      }
      setIsLoading(false);
    };

    fetchService();
  }, [slug, supabase, router]);

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-grow bg-background">
          <Skeleton className="w-full h-[50vh]" />
          <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!service) {
    return (
      <>
        <Header />
        <main className="flex-grow bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Service non trouvé</h1>
            <p className="text-muted-foreground">Le service que vous recherchez n'existe pas.</p>
            <Button asChild className="mt-4">
              <Link href="/services">Retour aux services</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  const isHydromassage = service.name === 'Hydromassage';

  if (!isHydromassage) {
    // Fallback for other services that do not have a custom page yet
    return (
        <>
            <Header />
            <main className="flex-grow bg-background">
                <section className="relative w-full h-[50vh] bg-black text-white">
                    <Image
                        src={serviceImages[service.name] || `https://picsum.photos/seed/${service.id}/1920/1080`}
                        alt={service.name}
                        fill
                        style={{ objectFit: "cover" }}
                        className="opacity-40"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl">{service.name}</h1>
                        <p className="max-w-2xl mt-4 text-lg md:text-xl">
                        {service.description}
                        </p>
                         <Button asChild size="lg" className="mt-8">
                            <Link href="/reserver">Réserver une Séance</Link>
                        </Button>
                    </div>
                </section>
                <section className="py-12 md:py-20 bg-background">
                    <div className="container mx-auto px-4 md:px-6 max-w-2xl text-center">
                         <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold">Page en construction</h2>
                        <p className="text-muted-foreground mt-2">Plus de détails sur ce service seront bientôt disponibles.</p>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] bg-black text-white">
          <Image
            src={serviceImages[service.name] || `https://picsum.photos/seed/${service.id}/1920/1080`}
            alt={service.name}
            fill
            style={{ objectFit: "cover" }}
            className="opacity-40"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-6xl">Hydromassage</h1>
            <p className="max-w-3xl mt-4 text-lg md:text-xl">
                La façon la plus rapide et confortable de détendre tout le corps.
            </p>
             <Button asChild size="lg" className="mt-8">
                <Link href="/reserver">Réserver une Séance</Link>
            </Button>
          </div>
        </section>

        {/* What is Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative h-80 md:h-96 w-full rounded-lg overflow-hidden shadow-xl">
                    <Image
                        src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Hydrojet/Hydrojet+with+man.webp"
                        alt="Personne se relaxant sur un lit d'hydromassage"
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="space-y-4">
                    <h2 className="font-headline text-3xl font-bold tracking-tight">Qu'est-ce que l'Hydromassage ?</h2>
                    <p className="text-muted-foreground text-lg">
                        L'hydromassage est un soin de relaxation moderne et innovant qui vous permet de profiter des bienfaits d'un massage à l'eau chaude, sans vous déshabiller et sans contact direct avec l'eau.
                    </p>
                    <p className="text-muted-foreground text-lg">
                        Il suffit de 15 minutes pour sentir votre corps se détendre pendant que vous flottez sur un matelas d'eau chauffée, tandis que deux jets puissants parcourent tout votre corps sous une membrane flexible. Idéal pour ceux qui recherchent une relaxation immédiate, un soulagement musculaire, une réduction du stress et une sensation de légèreté.
                    </p>
                </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Les Bienfaits de l'Hydromassage</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <Card className="bg-card text-center p-6 border-0 shadow-lg">
                        <CardHeader><HeartPulse className="h-10 w-10 text-primary mx-auto mb-4" /><CardTitle>Relaxation et Anti-Stress</CardTitle></CardHeader>
                        <CardContent><ul className="text-sm text-muted-foreground list-none space-y-2"><li>Réduit la tension musculaire</li><li>Soulage le cou, les lombaires et le dos</li><li>Diminue l'anxiété et le stress quotidien</li></ul></CardContent>
                    </Card>
                     <Card className="bg-card text-center p-6 border-0 shadow-lg">
                        <CardHeader><Dumbbell className="h-10 w-10 text-primary mx-auto mb-4" /><CardTitle>Récupération Musculaire</CardTitle></CardHeader>
                        <CardContent><ul className="text-sm text-muted-foreground list-none space-y-2"><li>Augmente le flux sanguin</li><li>Améliore l'oxygénation des tissus</li><li>Aide à la récupération post-entraînement</li></ul></CardContent>
                    </Card>
                     <Card className="bg-card text-center p-6 border-0 shadow-lg">
                        <CardHeader><Waves className="h-10 w-10 text-primary mx-auto mb-4" /><CardTitle>Soulagement des Jambes</CardTitle></CardHeader>
                        <CardContent><ul className="text-sm text-muted-foreground list-none space-y-2"><li>Stimule le retour veineux</li><li>Améliore la circulation lymphatique</li><li>Réduit la sensation de jambes lourdes</li></ul></CardContent>
                    </Card>
                     <Card className="bg-card text-center p-6 border-0 shadow-lg">
                        <CardHeader><Star className="h-10 w-10 text-primary mx-auto mb-4" /><CardTitle>Bien-être Général</CardTitle></CardHeader>
                        <CardContent><ul className="text-sm text-muted-foreground list-none space-y-2"><li>Expérience énergisante</li><li>Relaxation profonde en quelques minutes</li><li>Améliore l'humeur et la productivité</li></ul></CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter">Comment ça fonctionne ?</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-4">
                        <p className="text-muted-foreground text-lg">
                            Le client s'allonge, entièrement habillé, sur un lit d'eau chauffée. Deux jets d'eau chaude se déplacent sous la surface d'une membrane flexible, massant le corps des pieds à la tête avec des mouvements variés. La séance est automatique, rapide et extrêmement confortable : il suffit de choisir le programme et de se détendre.
                        </p>
                        <h4 className="font-semibold text-foreground pt-4">Programmes disponibles :</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Corps entier</li>
                            <li>Bas du dos</li>
                            <li>Épaules et cou</li>
                            <li>Jambes</li>
                            <li>Massage relaxant</li>
                            <li>Massage revitalisant</li>
                        </ul>
                    </div>
                     <div className="relative h-80 md:h-96 w-full rounded-lg overflow-hidden shadow-xl">
                        <Image
                            src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Hydrojet/Hydrojet+product+only.webp"
                            alt="Schéma de fonctionnement de l'hydromassage"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            </div>
        </section>
        
        {/* Experience Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">L'Expérience en Détail</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 items-stretch">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">Confort Total</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                            <Image src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Hydrojet/Hydrojet+with+man.webp" alt="Confort Total" fill className="object-cover"/>
                        </div>
                        <p className="text-muted-foreground">Imaginez-vous flottant sur un matelas d'eau chauffée à une température agréable, massé par des jets d'eau chaude de la tête aux pieds.</p>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">Massage Complet</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                            <Image src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Hydrojet/Hydrojet+product+only.webp" alt="Massage Complet" fill className="object-cover"/>
                        </div>
                        <p className="text-muted-foreground">Deux puissants jets d'eau parcourent tout votre corps en différents mouvements, offrant une relaxation profonde en seulement 15 minutes.</p>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">Confidentialité Garantie</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                             <Image src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Hydrojet/newaquaticanowback.png" alt="Confidentialité Garantie" fill className="object-cover"/>
                        </div>
                        <p className="text-muted-foreground">Pas besoin de vous déshabiller. Profitez de votre séance entièrement habillé, garantissant un maximum de confort, de rapidité et d'intimité.</p>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">Contrôle Intuitif</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                            <Image src="https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Hydrojet/Optionsnoback.png" alt="Contrôle Intuitif" fill className="object-cover"/>
                        </div>
                        <p className="text-muted-foreground">D'un simple clic, lancez l'un des six massages prédéfinis, axés sur des zones spécifiques ou sur un effet relaxant ou revitalisant.</p>
                    </CardContent>
                </Card>
            </div>
          </div>
        </section>


        {/* Security and Recommendations */}
        <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Sécurité et Recommandations</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="text-green-500"/>Recommandé Pour</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <p className="flex items-center text-muted-foreground"><Users className="h-5 w-5 mr-3 text-primary"/>Personnes stressées, tendues ou anxieuses</p>
                             <p className="flex items-center text-muted-foreground"><Leaf className="h-5 w-5 mr-3 text-primary"/>Professionnels passant de longues heures debout</p>
                             <p className="flex items-center text-muted-foreground"><Waves className="h-5 w-5 mr-3 text-primary"/>Ceux qui souffrent de jambes lourdes ou de mauvaise circulation</p>
                             <p className="flex items-center text-muted-foreground"><Dumbbell className="h-5 w-5 mr-3 text-primary"/>Sportifs cherchant à récupérer</p>
                             <p className="flex items-center text-muted-foreground"><HeartPulse className="h-5 w-5 mr-3 text-primary"/>Personnes souffrant de douleurs musculaires légères</p>
                        </CardContent>
                    </Card>
                     <Card className="border-destructive/50 bg-destructive/5">
                        <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><Ban />Contre-indications</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <p className="flex items-center text-destructive/90"><ShieldCheck className="h-5 w-5 mr-3"/>Femmes enceintes</p>
                             <p className="flex items-center text-destructive/90"><ShieldCheck className="h-5 w-5 mr-3"/>Personnes souffrant de problèmes cardiaques graves</p>
                             <p className="flex items-center text-destructive/90"><ShieldCheck className="h-5 w-5 mr-3"/>Personnes ayant des infections cutanées ou des plaies ouvertes</p>
                             <p className="flex items-center text-destructive/90"><ShieldCheck className="h-5 w-5 mr-3"/>Ceux qui souffrent de thrombose ou de phlébite</p>
                             <p className="font-semibold text-muted-foreground mt-4">En cas de doute, nous recommandons de consulter un professionnel de santé.</p>
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
                        <AccordionTrigger>Dois-je me déshabiller ?</AccordionTrigger>
                        <AccordionContent>
                        Non. La séance se déroule entièrement habillé pour votre confort.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Vais-je être mouillé ?</AccordionTrigger>
                        <AccordionContent>
                        Non. L'eau reste sous une membrane flexible et n'entre jamais en contact avec votre corps.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>Est-ce que ça fait mal ?</AccordionTrigger>
                        <AccordionContent>
                        Non. La pression est réglable et l'expérience est totalement confortable et relaxante.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>Combien de temps dure une séance ?</AccordionTrigger>
                        <AccordionContent>
                        Chaque séance dure 15 minutes.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-5">
                        <AccordionTrigger>Est-ce hygiénique ?</AccordionTrigger>
                        <AccordionContent>
                        Oui. Comme il n'y a pas de contact direct avec l'eau, et que la surface est désinfectée entre chaque client, l'hygiène est maximale.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-secondary/30 text-center">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Prêt pour une relaxation profonde ?</h2>
                <p className="max-w-xl mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                    15 minutes qui transforment votre corps et votre journée.
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
                    L'hydromassage est un soin de bien-être non invasif. Il ne remplace pas une consultation médicale et n'est pas destiné à diagnostiquer ou à traiter des maladies. Si vous avez des conditions médicales spécifiques, veuillez consulter un professionnel de santé avant utilisation.
                  </AlertDescription>
                </Alert>
            </div>
        </div>

      </main>
      <Footer />
    </>
  );
}