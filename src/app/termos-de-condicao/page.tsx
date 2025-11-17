'use client';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function TermsAndConditionsPage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Termes et Conditions d'Utilisation</h1>
          <div className="space-y-6 text-muted-foreground">
            <p>Dernière mise à jour : 17 novembre 2025</p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">1. Identification et Champ d'Application</h2>
            <p>
              Les présents Termes et Conditions d'Utilisation (ci-après "Termes") régissent l'utilisation de la plateforme de prise de rendez-vous en ligne et de souscription numérique désignée M.E Experience, propriété de et exploitée par la société M.E Beauty, personne morale ayant son siège social au 20 Grand-Rue, L-3650 Tétange, Kayl, Luxembourg, immatriculée sous le numéro RCS B286312, avec l'EUID LURCSL.B286312 et le numéro d'identification fiscale TVA LU35923632 (ci-après le "Prestataire").
            </p>
            <p>
              L'accès, la navigation et l'utilisation de la Plateforme (y compris ses sous-domaines et applications mobiles) impliquent l'acceptation pleine et entière des présents Termes par l'utilisateur ("Client" ou "Utilisateur"), ainsi que l'engagement de respecter toutes les dispositions légales et réglementaires applicables au Grand-Duché de Luxembourg et dans l'Union Européenne.
            </p>
            <p>
              Ces Termes constituent un contrat d'adhésion conclu entre M.E Beauty et le Client, ayant une valeur juridique équivalente à un contrat signé sur support physique, et prévalent sur tout document contradictoire émis par le Client.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">2. Objet et Nature des Services</h2>
            <p>La Plateforme M.E Experience a pour objet de fournir au Client :</p>
            <ul className="list-disc list-inside space-y-2">
                <li>l'acquisition de plans de souscription mensuels et des services associés ;</li>
                <li>la prise et la gestion de rendez-vous pour des traitements et des séances de bien-être ;</li>
                <li>la réalisation de paiements en ligne via le prestataire externe Stripe Payments Europe Ltd. ;</li>
                <li>l'accès à des informations, recommandations, historique de consommation et gestion personnelle du solde de minutes.</li>
            </ul>
            <p>
              Le Prestataire se réserve le droit de modifier, suspendre, altérer ou supprimer, temporairement ou définitivement, toute fonctionnalité ou service offert, sans que cela ne constitue, en aucun cas, un droit à indemnisation ou compensation pour le Client, sauf disposition impérative contraire.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">3. Conditions d'Accès et Création de Compte</h2>
            <p>
              3.1. L'accès à la Plateforme est libre, mais l'utilisation des services nécessite un enregistrement préalable et la création d'un compte personnel.
            </p>
            <p>
              3.2. Au moment de l'enregistrement, le Client doit fournir des données véridiques, complètes et à jour, incluant nom, prénom, adresse de courrier électronique, numéro de téléphone et date de naissance.
            </p>
            <p>
              3.3. Le Client déclare être majeur (18 ans) et posséder la pleine capacité juridique pour contracter. Le Prestataire se réserve le droit de demander une preuve d'identité à tout moment.
            </p>
            <p>
              3.4. Le Client s'engage à maintenir la confidentialité de ses identifiants d'accès et reconnaît que toute utilisation effectuée via son compte sera présumée comme étant de son fait. M.E Beauty ne pourra être tenue responsable des pertes ou dommages résultant d'un usage abusif du compte, de négligence ou du partage des identifiants.
            </p>
            <p>
              3.5. Le Prestataire pourra suspendre ou clôturer le compte du Client, avec ou sans préavis, en cas de :
            </p>
             <ul className="list-disc list-inside space-y-2">
                <li>non-respect des présents Termes ;</li>
                <li>fraude, abus, manipulation de réservations ou tentative d'intrusion ;</li>
                <li>comportement offensant, diffamatoire ou préjudiciable à la réputation de l'entreprise ;</li>
                <li>obligation légale ou ordre administratif ou judiciaire.</li>
            </ul>
            <p>
              La suppression du compte entraîne la cessation immédiate de tous les services associés, sans remboursement des sommes déjà facturées, sauf disposition expresse contraire.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground pt-4">4. Souscriptions, Paiements et Renouvellements</h2>
            <p>
              4.1. Le Client peut souscrire à des plans mensuels moyennant un paiement anticipé, donnant lieu à une souscription automatique et récurrente, traitée par le système Stripe, qui gère le débit périodique du montant correspondant.
            </p>
            <p>
              4.2. En adhérant à un plan, le Client autorise expressément Stripe et M.E Beauty à procéder au prélèvement automatique sur le mode de paiement indiqué, jusqu'à l'annulation volontaire de la souscription par le Client.
            </p>
            <p>
              4.3. Tous les prix indiqués sur la Plateforme incluent la TVA au taux légal en vigueur au Luxembourg, sauf indication expresse contraire.
            </p>
            <p>
              4.4. En cas d'échec de paiement, de refus de prélèvement, de carte expirée ou de fonds insuffisants, le compte pourra être suspendu jusqu'à régularisation.
            </p>
            <p>
              4.5. M.E Beauty se réserve le droit de modifier les tarifs des souscriptions, en communiquant une telle modification avec un préavis minimum de 15 jours. La poursuite de l'utilisation après cette date constitue une acceptation tacite du nouveau tarif.
            </p>
            <p>
              4.6. Les souscriptions ne sont ni transférables ni cessibles à des tiers. Le Client reconnaît que chaque plan est strictement personnel et non transférable.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground pt-4">5. Rendez-vous, Annulations et Pénalités</h2>
             <p>
              5.1. Le Client pourra prendre des rendez-vous selon les disponibilités affichées sur la Plateforme. Chaque réservation est contraignante et constitue un engagement de présence.
            </p>
            <p>
              5.2. Le Client peut annuler ou reporter une séance directement via son compte. Les conditions d'annulation sont les suivantes :
            </p>
            <ul className="list-disc list-inside space-y-2">
                <li>Plus de 24 heures à l'avance : droit au remboursement total du montant payé ou à la restitution intégrale des minutes.</li>
                <li>Moins de 24 heures avant l'heure prévue : remboursement partiel de 50 % ou déduction proportionnelle des minutes.</li>
                <li>Après l'heure prévue ou en cas d'absence ("no-show") : perte totale du montant payé et des minutes correspondantes.</li>
            </ul>
            <p>
              5.3. L'annulation n'est considérée comme effective qu'après confirmation électronique émise par la Plateforme.
            </p>
            <p>
              5.4. M.E Beauty se réserve le droit de modifier ou d'annuler unilatéralement un rendez-vous pour des raisons techniques, d'indisponibilité de l'équipement, de force majeure ou d'absence justifiée d'un professionnel. Dans ces cas, le Client pourra choisir entre un report sans frais ou un remboursement intégral.
            </p>
             <p>
              5.5. En aucune circonstance, le Prestataire ne pourra être tenu responsable des dommages indirects résultant de l'annulation, tels que la perte de temps, les frais de déplacement, les dommages moraux ou les manques à gagner.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground pt-4">6. Droit de Rétractation</h2>
            <p>
              6.1. Conformément à la Directive 2011/83/UE et au Code de la consommation luxembourgeois, le Client dispose d'un délai de 14 jours à compter de la date d'adhésion pour exercer son droit de rétractation, sans avoir à justifier de motifs.
            </p>
            <p>
              6.2. Ce droit n'est pas applicable si le Client demande expressément le début de la prestation avant l'expiration dudit délai, reconnaissant qu'en commençant à utiliser la souscription ou en effectuant le premier rendez-vous, il renonce à son droit de rétractation.
            </p>
            <p>
              6.3. L'exercice du droit de rétractation doit être communiqué par écrit à contact@me-experience.lu, en indiquant le nom complet, l'email d'enregistrement et le plan souscrit.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">7. Garanties, Limitations et Exonérations de Responsabilité</h2>
            <p>
              7.1. Tous les services offerts par M.E Beauty sont de nature esthétique et de bien-être, et ne constituent en aucun cas un acte médical, un diagnostic clinique ou thérapeutique.
            </p>
            <p>
              7.2. Le Client déclare avoir été informé que l'efficacité et les résultats varient d'une personne à l'autre, en fonction de facteurs biologiques, comportementaux et de santé, et que des résultats spécifiques, permanents ou uniformes ne sont pas garantis.
            </p>
            <p>
              7.3. Le Prestataire ne sera pas responsable des :
            </p>
            <ul className="list-disc list-inside space-y-2">
                <li>dommages résultant d'une utilisation incorrecte, négligente ou non conforme aux instructions ;</li>
                <li>réactions indésirables dues à des conditions médicales préexistantes non communiquées ;</li>
                <li>interruptions de service causées par des tiers (ex. : pannes de Stripe, fournisseurs, réseau, serveur) ;</li>
                <li>cas fortuit, force majeure, décisions administratives ou catastrophes naturelles.</li>
            </ul>
             <p>
              7.4. Le Client s'engage à respecter toutes les recommandations de sécurité et les contre-indications médicales figurant dans les Termes, assumant l'entière responsabilité de l'utilisation des équipements et installations.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">8. Obligations du Client</h2>
            <p>
              8.1. Le Client s'engage à utiliser la Plateforme et les services de manière éthique, sûre et conforme à la loi, en s'abstenant de :
            </p>
            <ul className="list-disc list-inside space-y-2">
                <li>diffuser du contenu illicite, diffamatoire, obscène ou trompeur ;</li>
                <li>violer les droits de propriété intellectuelle de M.E Beauty ou de tiers ;</li>
                <li>commettre des actes susceptibles d'endommager, de surcharger ou de compromettre le fonctionnement de la Plateforme ;</li>
                <li>reproduire, copier ou exploiter commercialement toute partie du contenu ou du logiciel sans autorisation écrite.</li>
            </ul>
             <p>
              8.2. Le non-respect de l'une de ces obligations pourra entraîner la suspension ou la résiliation immédiate du compte et une éventuelle responsabilité civile ou pénale.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground pt-4">9. Propriété Intellectuelle</h2>
             <p>
              9.1. Tous les éléments composant la Plateforme — design, mise en page, logos, textes, photographies, vidéos, logiciels et code source — sont la propriété exclusive de M.E Beauty, protégés par les droits d'auteur et la propriété industrielle.
            </p>
            <p>
              9.2. Aucun contenu ne peut être copié, reproduit, republié, transmis, affiché ou distribué, en tout ou en partie, sans l'autorisation préalable et écrite du titulaire.
            </p>
             <p>
              9.3. Le nom commercial "M.E Experience" est une marque déposée. Toute utilisation abusive sera passible de poursuites judiciaires pour violation de marque et concurrence déloyale.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">10. Suspension et Résiliation du Service</h2>
             <p>
              10.1. Le Prestataire pourra, à tout moment et sans préavis, suspendre ou interrompre la Plateforme pour des raisons techniques, de sécurité, de maintenance ou de force majeure.
            </p>
            <p>
              10.2. En cas de fermeture définitive, M.E Beauty en informera les Clients actifs avec un préavis minimum de 30 jours, en assurant le remboursement proportionnel des montants non utilisés.
            </p>
            <p>
              10.3. La résiliation pour non-respect imputable au Client ne donne droit à aucune compensation ou restitution.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">11. Modifications Contractuelles</h2>
            <p>
              11.1. M.E Beauty se réserve le droit de modifier unilatéralement ces Termes, en notifiant les Clients par email ou via la Plateforme.
            </p>
            <p>
              11.2. Les modifications entrent en vigueur à la date indiquée dans la communication. L'utilisation continue de la Plateforme après cette date constitue une acceptation tacite des nouvelles conditions.
            </p>
             <p>
              11.3. Si le Client n'est pas d'accord, il pourra cesser l'utilisation et demander la clôture de son compte, en respectant les délais contractuels applicables.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-4">12. Force Majeure</h2>
            <p>
              Aucune des parties ne sera responsable d'un manquement contractuel dû à un événement de force majeure, y compris, mais sans s'y limiter : pannes électriques, incendie, inondations, pandémies, guerre, grève, décisions gouvernementales, indisponibilité des fournisseurs ou catastrophes naturelles. Pendant ces périodes, les obligations sont suspendues jusqu'à la normalisation de la situation.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground pt-4">13. Loi Applicable et Juridiction Compétente</h2>
            <p>
              Les présents Termes sont régis par la législation du Grand-Duché de Luxembourg. Tout litige relatif à leur interprétation, validité ou exécution sera soumis à la compétence exclusive des Tribunaux de l'arrondissement de Luxembourg-Ville, sans préjudice des dispositions impératives en matière de protection des consommateurs.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground pt-4">14. Dispositions Finales</h2>
            <p>
              14.1. La nullité partielle d'une clause n'affectera pas la validité des autres.
            </p>
            <p>
              14.2. La version publiée sur la Plateforme prévaut sur toute version antérieure.
            </p>
            <p>
              14.3. Le Client reconnaît que ce document constitue l'accord intégral entre les parties, remplaçant toutes négociations ou communications antérieures, orales ou écrites.
            </p>

            <div className="pt-6 font-semibold">
              <p>📄 M.E Beauty S.à r.l.</p>
              <p>20 Grand-Rue, L-3650 Tétange, Kayl, Luxembourg</p>
              <p>RCS B286312 – EUID LURCSL.B286312 – TVA LU35923632</p>
              <p>📧 contact@me-experience.lu</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
