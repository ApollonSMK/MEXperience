import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export function Pricing() {
  const plans = [
    {
      title: "Plan Essentiel",
      price: "€49",
      period: "/mois",
      minutes: 50,
      pricePerMinute: 0.98,
      sessions: "2 à 3",
      features: [
        "Hydromassage",
        "Collagen Boost",
        "Dôme Infrarouge",
        "Banc Solaire",
        "1 invité par mois"
      ],
      popular: false,
    },
    {
      title: "Plan Avantage",
      price: "€79",
      period: "/mois",
      minutes: 90,
      pricePerMinute: 0.88,
      sessions: "4 à 6",
      features: [
        "Accès à tous les services",
        "Priorité de réservation",
        "2 invités par mois",
        "5% de réduction sur les forfaits",
      ],
      popular: true,
    },
    {
      title: "Plan Privilège",
      price: "€99",
      period: "/mois",
      minutes: 130,
      pricePerMinute: 0.76,
      sessions: "6 à 9",
      features: [
        "Accès à tous les services",
        "Priorité de réservation",
        "10% de réduction sur les produits",
        "1 invité par semaine",
        "Forfaits et Réductions Exclusifs",
      ],
      popular: false,
    },
  ];

  return (
    <section className="w-full py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Nos Plans d'Abonnement</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Choisissez le plan qui correspond le mieux à vos besoins et profitez d'avantages exclusifs.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-12 md:grid-cols-3 md:gap-12">
          {plans.map((plan) => (
            <Card key={plan.title} className={`flex flex-col ${plan.popular ? 'border-primary shadow-2xl' : ''}`}>
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center text-sm font-bold py-1 rounded-t-lg">
                  Le plus populaire
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="ml-1 text-xl font-medium text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  <div className="text-center bg-secondary/50 p-3 rounded-lg">
                    <p className="font-bold text-2xl">{plan.minutes}</p>
                    <p className="text-sm text-muted-foreground">minutes/mois (€{plan.pricePerMinute.toFixed(2)}/min)</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{plan.sessions} séances/mois</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                  S'abonner
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
