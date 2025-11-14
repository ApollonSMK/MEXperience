'use client';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Politique de Confidentialité</h1>
          <div className="space-y-6 text-muted-foreground">
            <p>Dernière mise à jour : 29 juillet 2024</p>
            
            <p>
              M.E Experience ("nous", "notre" ou "nos") exploite le site web [URL de votre site web] (le "Service"). Cette page vous informe de nos politiques concernant la collecte, l'utilisation et la divulgation des données personnelles lorsque vous utilisez notre Service et les choix que vous avez associés à ces données.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">1. Collecte et Utilisation des Données</h2>
            <p>
              Nous collectons plusieurs types de données à différentes fins pour fournir et améliorer notre Service.
            </p>
            <h3 className="text-xl font-semibold text-foreground pt-2">Types de Données Collectées</h3>
            <p>
              <strong>Données Personnelles :</strong> Lors de l'utilisation de notre Service, nous pouvons vous demander de nous fournir certaines informations personnelles identifiables qui peuvent être utilisées pour vous contacter ou vous identifier ("Données Personnelles"). Celles-ci peuvent inclure, mais ne sont pas limitées à : l'adresse e-mail, le prénom et le nom, le numéro de téléphone, les cookies et les données d'utilisation.
            </p>
            <p>
              <strong>Données d'Utilisation :</strong> Nous pouvons également collecter des informations sur la manière dont le Service est accédé et utilisé ("Données d'Utilisation"). Ces Données d'Utilisation peuvent inclure des informations telles que l'adresse de protocole Internet de votre ordinateur (par exemple, l'adresse IP), le type de navigateur, la version du navigateur, les pages de notre Service que vous visitez, l'heure et la date de votre visite, le temps passé sur ces pages, et d'autres données de diagnostic.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">2. Utilisation des Données</h2>
            <p>M.E Experience utilise les données collectées à diverses fins :</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Pour fournir et maintenir notre Service</li>
              <li>Pour vous informer des changements apportés à notre Service</li>
              <li>Pour vous permettre de participer aux fonctionnalités interactives de notre Service lorsque vous le souhaitez</li>
              <li>Pour fournir un support client</li>
              <li>Pour recueillir des analyses ou des informations précieuses afin que nous puissions améliorer notre Service</li>
              <li>Pour surveiller l'utilisation de notre Service</li>
              <li>Pour détecter, prévenir et résoudre les problèmes techniques</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground pt-4">3. Sécurité des Données</h2>
            <p>
              La sécurité de vos données est importante pour nous, mais n'oubliez pas qu'aucune méthode de transmission sur Internet ou méthode de stockage électronique n'est sécurisée à 100 %. Bien que nous nous efforcions d'utiliser des moyens commercialement acceptables pour protéger vos Données Personnelles, nous ne pouvons garantir leur sécurité absolue.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">4. Vos Droits</h2>
            <p>
              Vous avez le droit d'accéder, de mettre à jour ou de supprimer les informations que nous avons sur vous. Chaque fois que cela est possible, vous pouvez accéder, mettre à jour ou demander la suppression de vos Données Personnelles directement dans la section des paramètres de votre compte. Si vous ne parvenez pas à effectuer ces actions vous-même, veuillez nous contacter pour vous aider.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">5. Modifications de cette Politique de Confidentialité</h2>
            <p>
              Nous pouvons mettre à jour notre Politique de Confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle Politique de Confidentialité sur cette page. Nous vous conseillons de consulter périodiquement cette Politique de Confidentialité pour tout changement.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">Contactez-nous</h2>
            <p>
              Si vous avez des questions concernant cette Politique de Confidentialité, veuillez nous contacter par e-mail à [votre e-mail de contact].
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
