'use client';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Pricing } from "@/components/pricing";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Award, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const SubscriptionBenefits = () => {
    const benefits = [
        {
            icon: <Award className="h-10 w-10 text-primary" />,
            title: "Rentabilité Maximale",
            description: "Profitez de nos meilleurs tarifs à la minute. Nos abonnements sont conçus pour vous offrir plus de soins pour moins cher.",
        },
        {
            icon: <Zap className="h-10 w-10 text-primary" />,
            title: "Flexibilité et Priorité",
            description: "Gérez vos minutes comme vous le souhaitez et bénéficiez d'un accès prioritaire à nos services les plus demandés.",
        },
        {
            icon: <CheckCircle2 className="h-10 w-10 text-primary" />,
            title: "Avantages Exclusifs",
            description: "Accédez à des réductions sur les produits, des pass pour invités et des offres spéciales réservées uniquement à nos membres.",
        }
    ];

    return (
        <section className="w-full py-12 md:py-16 bg-secondary/50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Pourquoi S'abonner ?</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                        Un abonnement M.E Experience est plus qu'un simple achat, c'est un investissement dans votre bien-être continu.
                    </p>
                </div>
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
                    {benefits.map((benefit) => (
                        <div key={benefit.title} className="bg-background p-8 rounded-lg shadow-lg flex flex-col items-center text-center">
                            <div className="mb-4">{benefit.icon}</div>
                            <h3 className="mb-2 text-xl font-semibold">{benefit.title}</h3>
                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};


export default function AbonnementsPage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        <section className="relative w-full h-[50vh] bg-black text-white">
            <Image
                src="https://supabase.me-experience.lu/storage/v1/object/public/images/All/Abonnement.png"
                alt="Devenez Membre M.E Experience"
                layout="fill"
                objectFit="cover"
                className="opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl">Devenez Membre M.E Experience</h1>
                <p className="max-w-[900px] mt-4 text-lg text-white/90 md:text-xl/relaxed">
                    Découvrez nos plans d'abonnement et choisissez celui qui vous offre la flexibilité et les avantages dont vous avez besoin pour une routine de bien-être parfaite.
                </p>
            </div>
        </section>

        <Pricing />

        <SubscriptionBenefits />

        <section className="w-full py-12 md:py-20 text-center">
             <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Prêt à commencer ?</h2>
                <p className="max-w-[600px] mx-auto mt-4 text-muted-foreground md:text-xl/relaxed">
                    Faites le premier pas vers une routine de bien-être personnalisée. Réservez votre premier soin dès aujourd'hui.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg">
                        <Link href="/agendar">Réserver un Soin</Link>
                    </Button>
                </div>
             </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
