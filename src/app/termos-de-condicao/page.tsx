'use client';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function TermsAndConditionsPage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Termes et Conditions</h1>
          <div className="space-y-6 text-muted-foreground">
            <p>Dernière mise à jour : 29 juillet 2024</p>

            <p>
              Veuillez lire attentivement ces termes et conditions avant d'utiliser notre service.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">1. Introduction</h2>
            <p>
              Bienvenue chez M.E Experience. En accédant à notre site web et en utilisant nos services, vous acceptez d'être lié par les présents Termes et Conditions. Si vous n'êtes pas d'accord avec une partie de ces termes, vous ne pouvez pas accéder au Service.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">2. Comptes</h2>
            <p>
              Lorsque vous créez un compte chez nous, vous devez nous fournir des informations exactes, complètes et à jour à tout moment. Le non-respect de cette obligation constitue une violation des Termes, ce qui peut entraîner la résiliation immédiate de votre compte sur notre Service.
            </p>
            <p>
              Vous êtes responsable de la protection du mot de passe que vous utilisez pour accéder au Service et de toute activité ou action effectuée sous votre mot de passe.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">3. Abonnements et Paiements</h2>
            <p>
              Certains de nos Services sont facturés sur la base d'un abonnement. Vous serez facturé à l'avance, de manière récurrente et périodique ("cycle de facturation"). Les cycles de facturation sont fixés sur une base mensuelle.
            </p>
            <p>
              À la fin de chaque cycle de facturation, votre abonnement sera automatiquement renouvelé dans les mêmes conditions, sauf si vous l'annulez ou si M.E Experience l'annule. Vous pouvez annuler le renouvellement de votre abonnement via la page de gestion de votre compte en ligne.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">4. Annulation et Rendez-vous</h2>
            <p>
              Veuillez vous référer à notre Politique de Remboursement pour les détails concernant l'annulation de services et d'abonnements. Il est de votre responsabilité de vous assurer que vous annulez les rendez-vous conformément à notre politique pour éviter des frais.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground pt-4">5. Propriété Intellectuelle</h2>
            <p>
              Le Service et son contenu original, ses caractéristiques et ses fonctionnalités sont et resteront la propriété exclusive de M.E Experience et de ses concédants de licence.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">6. Limitation de Responsabilité</h2>
            <p>
              En aucun cas M.E Experience, ni ses administrateurs, employés, partenaires, agents, fournisseurs ou affiliés, ne pourront être tenus responsables de tout dommage indirect, accessoire, spécial, consécutif ou punitif, y compris, sans s'y limiter, la perte de profits, de données, d'utilisation, de clientèle, ou d'autres pertes intangibles.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground pt-4">7. Modifications</h2>
            <p>
              Nous nous réservons le droit, à notre seule discrétion, de modifier ou de remplacer ces Termes à tout moment. En continuant à accéder ou à utiliser notre Service après l'entrée en vigueur de ces révisions, vous acceptez d'être lié par les termes révisés.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground pt-4">Contactez-nous</h2>
            <p>
              Si vous avez des questions sur ces Termes, veuillez nous contacter à [votre e-mail de contact].
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
