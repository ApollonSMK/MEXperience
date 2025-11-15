'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { HeartPulse, Waves, Leaf, Wind, ShieldCheck, Cpu, Users, Sparkles, Car, Coffee, Info } from 'lucide-react';
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

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = getSupabaseBrowserClient();

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
      const currentService = allServices.find(s => s.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') === slug);

      setService(currentService || null);
      setIsLoading(false);
    };

    fetchService();
  }, [slug, supabase]);

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
  
  // Hardcoded content for Hydromassage for now
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
            layout="fill"
            objectFit="cover"
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
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
             <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground">
                <p className="lead text-xl text-center">
                    Imagine-se a flutuar com todo o conforto num colchão de água aquecido a uma temperatura agradável enquanto é massajado por mãos invisíveis da cabeça aos pés. Feche os olhos e aprecie como dois jactos de água quente podem criar uma sensação de bem-estar e relaxamento profundo em apenas alguns minutos!
                </p>
                <p>
                    E o mais incrível é que não precisa de se despir para um maior conforto, rapidez e privacidade. Deite-se de costas, completamente vestido, e flutue num leito de água quente enquanto dois potentes jactos de água são projectados por baixo da borracha flexível, durável e impermeável!
                </p>
                 <p>
                    Os dois jactos de água quente percorrem todo o comprimento do corpo em diferentes direcções e movimentos para massajar todo o corpo e proporcionar uma sensação de bem-estar em apenas 15 minutos.
                 </p>
                <p>
                    Basta um simples clique para iniciar uma das seis massagens pré-definidas que visam uma área específica (corpo inteiro, parte inferior das costas, ombros e pescoço, pernas) e um tipo de massagem (relaxante ou revitalizante).
                </p>
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-12 md:py-20 bg-secondary/50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Os benefícios da hidromassagem</h2>
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

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 text-center">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Pronto para relaxar?</h2>
                <p className="max-w-[600px] mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                    Reserve a sua sessão de hidromassagem e sinta a diferença.
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
