'use client';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function RefundPolicyPage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Politique de Remboursement</h1>
          <div className="space-y-6 text-muted-foreground">
            <p>Dernière mise à jour : 29 juillet 2024</p>

            <p>
              Chez M.E Experience, nous nous efforçons de garantir la satisfaction de nos clients. Cette politique décrit les conditions dans lesquelles des remboursements peuvent être accordés pour nos services et abonnements.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">1. Abonnements</h2>
            <p>
              Les paiements d'abonnement sont facturés sur une base mensuelle récurrente. Vous pouvez annuler votre abonnement à tout moment depuis votre page de profil.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Annulation :</strong> Si vous annulez, votre abonnement restera actif jusqu'à la fin de votre cycle de facturation en cours. Aucun remboursement partiel ne sera effectué pour la période restante.</li>
              <li><strong>Non-remboursable :</strong> Les frais d'abonnement déjà payés ne sont pas remboursables, que l'abonnement soit utilisé ou non.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground pt-4">2. Rendez-vous et Services Individuels</h2>
            <p>
              Les paiements pour des rendez-vous ou des services individuels sont soumis aux conditions suivantes :
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Annulation par le client :</strong> Si vous annulez votre rendez-vous plus de 24 heures à l'avance, vous pourriez avoir droit à un crédit pour un futur service. Les annulations effectuées moins de 24 heures avant le rendez-vous ne sont pas éligibles à un remboursement ou à un crédit.</li>
              <li><strong>Non-présentation :</strong> Les clients qui ne se présentent pas à leur rendez-vous sans préavis ne recevront aucun remboursement ou crédit.</li>
              <li><strong>Paiement avec minutes d'abonnement :</strong> Si un rendez-vous payé avec les minutes de votre abonnement est annulé conformément à notre politique, les minutes seront recréditées sur votre compte.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-foreground pt-4">3. Circonstances Exceptionnelles</h2>
            <p>
              Nous comprenons que des circonstances exceptionnelles peuvent survenir. Si vous pensez que votre situation justifie une exception à cette politique, veuillez nous contacter directement pour discuter de votre cas. Les remboursements dans ces circonstances sont accordés à notre seule discrétion.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">Contactez-nous</h2>
            <p>
              Pour toute question concernant notre politique de remboursement, veuillez nous contacter à [votre e-mail de contact].
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
