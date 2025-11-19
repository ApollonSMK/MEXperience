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
import { HeartPulse, Waves, Leaf, Wind, Info, Droplets, UserCheck, Timer, SlidersHorizontal, AlertTriangle, Ban, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Service as ServiceType, PricingTier } from '@/app/admin/services/page';

const serviceImages: { [key: string]: string } = {
  'Hydromassage': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/Hydro.png',
  'Collagen Boost': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/CollagenBoost.png',
  'Dôme Infrarouge': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/Infrared.png',
  'Banc Solaire': 'https://supabase.me-experience.lu/storage/v1/object/public/images/Cards/BancSolaire.png'
};

const benefits = [
    {
      icon: <HeartPulse className="h-8 w-8 text-primary" />,
      title: "Anti-stress et Ansiedade",
      description: "Reduz a tensão muscular (pescoço e região lombar) para reduzir o stress e a ansiedade no trabalho ou em viagem.",
    },
    {
      icon: <Waves className="h-8 w-8 text-primary" />,
      title: "Recuperação muscular",
      description: "Aumenta o fluxo sanguíneo para os músculos, a pele e os tecidos, o que acelera a recuperação muscular após o exercício.",
    },
    {
      icon: <Leaf className="h-8 w-8 text-primary" />,
      title: "Bem-estar",
      description: "Uma sensação de bem-estar com um efeito energizante e revigorante em apenas alguns minutos para melhorar a produtividade.",
    },
    {
      icon: <Wind className="h-8 w-8 text-primary" />,
      title: "Alívio dos membros inferiores",
      description: "Massajar os membros inferiores promove o retorno venoso e estimula o fluxo linfático para reduzir a sensação de pernas pesadas.",
    },
];

const experienceFeatures = [
    {
        id: "conforto",
        icon: <Droplets className="h-8 w-8 text-primary" />,
        title: "Conforto Total",
        description: "Imagine-se a flutuar num colchão de água aquecido a uma temperatura agradável, massajado por jatos de água quente da cabeça aos pés.",
        image: "https://images.unsplash.com/photo-1512290923902-8a9f213dc395?q=80&w=1974&auto=format&fit=crop",
    },
    {
        id: "privacidade",
        icon: <UserCheck className="h-8 w-8 text-primary" />,
        title: "Privacidade Garantida",
        description: "Não precisa de se despir. Desfrute da sua sessão completamente vestido, garantindo máximo conforto, rapidez e privacidade.",
        image: "https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Hydrojet/PrivacidadeGarantida.webp",

    },
    {
        id: "massagem",
        icon: <Timer className="h-8 w-8 text-primary" />,
        title: "Massagem Completa",
        description: "Dois potentes jatos de água percorrem todo o seu corpo em diferentes movimentos, proporcionando um relaxamento profundo em apenas 15 minutos.",
        image: "https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Hydrojet/ConfortoTotal.jpg",
    },
    {
        id: "controlo",
        icon: <SlidersHorizontal className="h-8 w-8 text-primary" />,
        title: "Controlo Intuitivo",
        description: "Com um simples clique, inicie uma das seis massagens pré-definidas, focadas em áreas específicas ou num efeito relaxante ou revitalizante.",
        image: "https://supabase.me-experience.lu/storage/v1/object/public/images/Services/Hydrojet/ControloIntuitivo.jpg",
    }
];

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
        setService(currentService);
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
            <h1 className="text-2xl font-bold">Serviço não encontrado</h1>
            <p className="text-muted-foreground">O serviço que você está procurando não existe.</p>
            <Button asChild className="mt-4">
              <Link href="/services">Voltar aos serviços</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  const isHydromassage = service.name === 'Hydromassage';

  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        {/* Hero Section */}
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
              {isHydromassage ? "A melhor maneira de relaxar em apenas 15 minutos." : service.description}
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-20 bg-background">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">Une Expérience Unique</h2>
                    <p className="lead text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
                        Fermez les yeux et appréciez comment deux jets d'eau chaude peuvent créer une sensation de bien-être et de relaxation profonde en quelques minutes !
                    </p>
                </div>
                 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {experienceFeatures.map((feature, index) => (
                        <div key={feature.id} className="space-y-4">
                            <div className="relative aspect-square w-full rounded-lg overflow-hidden">
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-12 md:py-20 bg-secondary/50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Les bienfaits de l'hydromassage</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map((benefit) => (
                        <Card key={benefit.title} className="bg-background text-center p-6">
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
        
        {/* Contraindications Section */}
        <section className="py-12 md:py-20 bg-background">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">À qui s'adresse ce soin ?</h2>
                    <p className="max-w-3xl mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                        Pour garantir votre sécurité et votre confort, veuillez consulter les informations importantes ci-dessous.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="border-destructive/50">
                        <CardContent className="p-6">
                           <div className="flex flex-col items-center text-center">
                                <Ban className="h-12 w-12 text-destructive mb-4"/>
                                <h3 className="text-xl font-bold text-destructive mb-2">Contre-indications</h3>
                                <p className="text-sm text-muted-foreground mb-4">Utilisation non recommandée. La sécurité avant tout.</p>
                           </div>
                           <div className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2"><X className="h-5 w-5 text-destructive mt-0.5 shrink-0" /><span>Maladies cardiovasculaires graves</span></div>
                                <div className="flex items-start gap-2"><X className="h-5 w-5 text-destructive mt-0.5 shrink-0" /><span>Problèmes circulatoires sévères</span></div>
                                <div className="flex items-start gap-2"><X className="h-5 w-5 text-destructive mt-0.5 shrink-0" /><span>Infections cutanées ou plaies ouvertes</span></div>
                                <div className="flex items-start gap-2"><X className="h-5 w-5 text-destructive mt-0.5 shrink-0" /><span>Fièvre ou infections contagieuses</span></div>
                                <div className="flex items-start gap-2"><X className="h-5 w-5 text-destructive mt-0.5 shrink-0" /><span>Grossesse (1er trimestre)</span></div>
                                <div className="flex items-start gap-2"><X className="h-5 w-5 text-destructive mt-0.5 shrink-0" /><span>Épilepsie non contrôlée</span></div>
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
                                <div className="flex items-start gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" /><span>Grossesse (après le 1er trimestre)</span></div>
                                <div className="flex items-start gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" /><span>Problèmes de dos sévères</span></div>
                                <div className="flex items-start gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" /><span>Prothèses ou implants récents</span></div>
                                <div className="flex items-start gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" /><span>Diabète non équilibré</span></div>
                                <div className="flex items-start gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" /><span>Hypotension ou historique de malaises</span></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-green-500/50">
                        <CardContent className="p-6">
                           <div className="flex flex-col items-center text-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4"/>
                                <h3 className="text-xl font-bold text-green-600 mb-2">Recommandé Pour</h3>
                                <p className="text-sm text-muted-foreground mb-4">Idéal si vous cherchez à soulager les maux suivants.</p>
                           </div>
                           <div className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span>Stress et anxiété</span></div>
                                <div className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span>Douleurs et tensions musculaires</span></div>
                                <div className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span>Récupération après l'effort sportif</span></div>
                                <div className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span>Sensation de jambes lourdes</span></div>
                                <div className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span>Besoin d'un boost d'énergie et de bien-être</span></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 text-center bg-secondary/50">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Prêt pour une relaxation inégalée ?</h2>
                <p className="max-w-[600px] mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                    Réservez votre séance d'hydromassage et découvrez une nouvelle dimension de bien-être.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg">
                        <Link href="/agendar">Agendar Agora</Link>
                    </Button>
                </div>
             </div>
        </section>
        
        {/* Disclaimer Section */}
        <section className="pb-12 md:pb-20">
             <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                 <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border">
                    <Info className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                        O HydroJet não está classificado como dispositivo médico. Todas as informações e materiais fornecidos, incluindo estudos científicos, são apenas para fins educacionais e não se destinam a demonstrar a segurança ou eficácia do dispositivo Hydrojet no diagnóstico, tratamento ou prevenção de qualquer doença. O dispositivo Hydrojet e todas as informações fornecidas não substituem o aconselhamento médico profissional, não diagnosticam problemas de saúde e não devem ser interpretados como aconselhamento médico. É essencial consultar um profissional de saúde antes da utilização, especialmente se tiver uma condição médica pré-existente ou se estiver a tomar qualquer medicação. Os resultados individuais podem variar.
                    </p>
                 </div>
            </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
