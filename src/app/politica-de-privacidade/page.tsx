'use client';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function PrivacyPolicyPage() {
  const date = "17 novembre 2025";

  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
            <header className="mb-10 text-center">
                <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="font-headline text-3xl font-bold md:text-4xl">Politique de Confidentialité</h1>
                <p className="text-sm text-muted-foreground mt-2">Dernière mise à jour : {date}</p>
            </header>

            <div className="space-y-8">
                
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">1. Identification et Champ d'Application</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>La présente <strong>Politique de Confidentialité</strong> (ci-après "Politique") a pour but d'informer, de manière claire, transparente et juridiquement adéquate, sur les conditions dans lesquelles la société M.E Beauty S.à r.l., opératrice de la marque M.E Experience, procède à la collecte, au traitement, à la conservation et à la protection des données personnelles de ses clients, utilisateurs, visiteurs et abonnés (ci-après "Client" ou "Utilisateur"), conformément au <strong>Règlement (UE) 2016/679</strong> du Parlement européen et du Conseil du 27 avril 2016 (Règlement Général sur la Protection des Données — RGPD) et à la Loi luxembourgeoise du 1er août 2018 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel.</p>
                        <p>Cette Politique s'applique à toutes les interactions du Client avec la Plateforme M.E Experience, y compris le site web, les sous-domaines, les applications mobiles, les formulaires, les systèmes de prise de rendez-vous, les paiements en ligne et la communication numérique.</p>
                        <p>L'accès et l'utilisation de la Plateforme impliquent <strong>l'acceptation pleine et entière</strong> de la présente Politique.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">2. Responsable du Traitement des Données</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Le responsable du traitement des données est la société <strong>M.E Beauty S.à r.l.</strong>, ayant son siège social au 20 Grand-Rue, L-3650 Tétange, Kayl, Luxembourg, immatriculée sous le numéro RCS B286312, avec le numéro d'identification fiscale TVA LU35923632, et le contact électronique contact@me-experience.lu (ci-après désignée "<strong>Responsable du Traitement</strong>" ou "Prestataire").</p>
                        <p>Aux fins du RGPD, M.E Beauty détermine les finalités et les moyens du traitement des données personnelles collectées, étant légalement responsable de leur licéité, sécurité et confidentialité.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">3. Définitions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Aux fins de cette Politique, on entend par :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li><strong>“Données Personnelles” :</strong> toute information relative à une personne physique identifiée ou identifiable ;</li>
                            <li><strong>“Traitement” :</strong> toute opération effectuée sur des données personnelles, telle que la collecte, l'enregistrement, l'organisation, la conservation, la consultation, l'utilisation, la transmission ou la destruction ;</li>
                            <li><strong>“Client” ou “Utilisateur” :</strong> personne physique qui utilise ou accède aux services de M.E Experience ;</li>
                            <li><strong>“Responsable du Traitement” :</strong> entité qui détermine les finalités et les moyens du traitement des données personnelles ;</li>
                            <li><strong>“Sous-traitant” :</strong> entité qui traite des données personnelles au nom et sur instruction du Responsable du Traitement ;</li>
                            <li><strong>“RGPD” :</strong> Règlement (UE) 2016/679 ;</li>
                            <li><strong>“Autorité de Contrôle” :</strong> Commission Nationale pour la Protection des Données (CNPD) — Luxembourg.</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">4. Types de Données Collectées</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>M.E Experience procède à la collecte et au traitement des types de données personnelles suivants, selon la nature des services utilisés :</p>
                         <ul className="list-disc list-inside space-y-2 pl-4">
                            <li><strong>a) Données d'Identification :</strong> nom, prénom, date de naissance, numéro de téléphone, adresse électronique et, le cas échéant, adresse postale.</li>
                            <li><strong>b) Données de Compte :</strong> nom d'utilisateur, mot de passe (stocké de manière chiffrée), historique des sessions, préférences linguistiques.</li>
                            <li><strong>c) Données de Souscription et de Facturation :</strong> numéro de client, plan actif, historique des paiements, factures, données de transaction (via Stripe).</li>
                            <li><strong>d) Données de Santé et de Bien-être :</strong> uniquement lorsqu'elles sont volontairement fournies pour assurer l'adéquation du traitement (ex. : conditions médicales, contre-indications, grossesse, allergies, médicaments).</li>
                            <li><strong>e) Données Techniques :</strong> adresse IP, journaux d'accès, type d'appareil, système d'exploitation, navigateur, cookies fonctionnels et analytiques.</li>
                            <li><strong>f) Données de Communication :</strong> messages, e-mails, demandes de contact et historique du support.</li>
                        </ul>
                        <p>Les données sont collectées <strong>directement auprès du Client</strong> ou par l'utilisation de la Plateforme, sur la base du consentement et de l'exécution contractuelle.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">5. Finalités du Traitement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Les données personnelles sont traitées <strong>exclusivement à des fins légitimes et déterminées</strong>, notamment :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                           <li><strong>Exécution du contrat</strong> de prestation de services (rendez-vous, abonnements, facturation et paiements) ;</li>
                            <li><strong>Gestion administrative</strong> et opérationnelle des comptes clients ;</li>
                            <li><strong>Gestion des communications</strong> (confirmer les rendez-vous, reports, avis de renouvellement et modifications de services) ;</li>
                            <li><strong>Respect des obligations légales</strong> (fiscales, comptables et réglementaires) ;</li>
                            <li><strong>Sécurité</strong> et prévention de la fraude ;</li>
                            <li><strong>Amélioration de l'expérience</strong> utilisateur et personnalisation des services ;</li>
                            <li>Envoi de communications promotionnelles et informatives, <strong>moyennant consentement exprès</strong> ;</li>
                            <li><strong>Respect des obligations en matière de santé</strong> et de sécurité, lorsque nécessaire à la prestation de certains services (ex. : vérification des contre-indications).</li>
                        </ul>
                        <p>Les données ne seront pas utilisées à des fins incompatibles avec celles indiquées, sauf nouveau consentement du titulaire.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">6. Base Juridique du Traitement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Le traitement des données personnelles par M.E Beauty repose sur des fondements juridiques légitimes prévus à l'article 6 du RGPD :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li><strong>Exécution contractuelle</strong> — nécessaire pour fournir les services demandés ;</li>
                            <li><strong>Respect d'une obligation légale</strong> — en matière fiscale, comptable et de sécurité ;</li>
                            <li><strong>Consentement exprès</strong> — pour les communications marketing, campagnes et offres ;</li>
                            <li><strong>Intérêt légitime</strong> — pour garantir la sécurité, l'amélioration et le fonctionnement de la plateforme ;</li>
                            <li><strong>Protection des intérêts vitaux</strong> — en cas d'urgence médicale ou de sécurité du Client.</li>
                        </ul>
                        <p>Le Client peut, à tout moment, <strong>retirer son consentement</strong>, sans que cela n'affecte la licéité du traitement préalablement effectué.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">7. Conservation des Données</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Les données personnelles sont conservées pendant la <strong>durée strictement nécessaire</strong> aux finalités pour lesquelles elles ont été collectées :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li><strong>Données contractuelles et de facturation :</strong> 10 ans, conformément aux obligations fiscales et comptables ;</li>
                            <li><strong>Données de compte et historique d'utilisation :</strong> tant que le compte est actif et jusqu'à 24 mois après sa clôture ;</li>
                            <li><strong>Données de santé (optionnelles) :</strong> supprimées après la fin de la prestation de services ou sur demande ;</li>
                            <li><strong>Journaux techniques et cookies :</strong> jusqu'à 12 mois après la collecte.</li>
                        </ul>
                        <p>À l'expiration des délais légaux, les données seront <strong>supprimées de manière sécurisée et irréversible</strong>.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">8. Communication et Partage de Données</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>M.E Beauty ne pourra partager des données personnelles avec des tiers que lorsque cela est <strong>strictement nécessaire</strong> et dans les situations suivantes :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                           <li><strong>Processeurs de paiement</strong> — Stripe Payments Europe Ltd., responsable du traitement sécurisé des transactions ;</li>
                            <li><strong>Fournisseurs techniques et d'hébergement</strong> — prestataires de services d'infrastructure et de sécurité numérique, sous clauses contractuelles de confidentialité ;</li>
                            <li><strong>Autorités publiques</strong> — lorsque légalement requis (administration fiscale, CNPD, autorités judiciaires) ;</li>
                            <li><strong>Professionnels de la santé</strong> — uniquement avec le consentement du Client, dans des cas spécifiques d'évaluation d'aptitude.</li>
                        </ul>
                        <p><strong>Aucune donnée n'est vendue, cédée ou exploitée commercialement</strong> par des tiers en dehors du cadre décrit ci-dessus.</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle className="font-headline">9. Transferts Internationaux</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>En cas de transfert de données personnelles en dehors de l'Espace Économique Européen (EEE), M.E Beauty garantit le respect des mesures prévues aux articles 44 à 50 du RGPD, notamment :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>l'utilisation de <strong>Clauses Contractuelles Types</strong> de la Commission Européenne ;</li>
                            <li>la vérification du <strong>niveau de protection adéquat</strong> du pays de destination ;</li>
                            <li>des mécanismes complémentaires de <strong>chiffrement et de contrôle d'accès</strong>.</li>
                        </ul>
                        <p>Les transferts n'auront lieu que lorsqu'ils sont <strong>strictement nécessaires</strong> au fonctionnement technique des services souscrits.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="font-headline">10. Droits du Titulaire des Données</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Le Client a le droit, conformément aux articles 12 à 22 du RGPD, de :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                           <li><strong>Accès :</strong> obtenir la confirmation du traitement de ses données et l'accès aux informations correspondantes ;</li>
                            <li><strong>Rectification :</strong> demander la correction ou la mise à jour des données inexactes ;</li>
                            <li><strong>Effacement (“droit à l'oubli”) :</strong> demander la suppression définitive de ses données, sauf lorsque la conservation est légalement obligatoire ;</li>
                            <li><strong>Limitation du traitement :</strong> suspendre temporairement le traitement dans certaines conditions ;</li>
                            <li><strong>Portabilité :</strong> recevoir ses données dans un format structuré et lisible ;</li>
                            <li><strong>Opposition :</strong> s'opposer au traitement fondé sur un intérêt légitime ou le marketing direct ;</li>
                            <li><strong>Retirer le consentement :</strong> à tout moment, lorsque le traitement est fondé sur ce fondement.</li>
                        </ul>
                        <p>Les demandes doivent être soumises par e-mail à <strong>contact@me-experience.lu</strong>, avec une preuve d'identité. M.E Beauty s'engage à répondre dans un <strong>délai maximum de 30 jours</strong>.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="font-headline">11. Sécurité et Confidentialité</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                         <p>M.E Beauty adopte des <strong>mesures techniques et organisationnelles appropriées</strong> pour protéger les données personnelles contre la perte, la destruction, l'altération, l'accès non autorisé ou la divulgation abusive, notamment :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                           <li>le chiffrement SSL/TLS des communications ;</li>
                            <li>des pare-feu et des systèmes de détection d'intrusion ;</li>
                            <li>un accès restreint au personnel autorisé ;</li>
                            <li>des politiques internes de confidentialité ;</li>
                            <li>un stockage sécurisé sur des serveurs au sein de l'Union Européenne.</li>
                        </ul>
                        <p>Toute violation de sécurité susceptible de compromettre des données personnelles sera communiquée à la CNPD et au titulaire, conformément aux articles 33 et 34 du RGPD.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="font-headline">12. Cookies et Technologies de Traçage</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>La Plateforme utilise des cookies techniques, fonctionnels et analytiques pour assurer son bon fonctionnement, mesurer le trafic et optimiser l'expérience utilisateur. Le Client peut configurer son navigateur pour bloquer ou supprimer les cookies, étant informé que cela pourrait limiter le fonctionnement de certaines fonctionnalités. Les cookies publicitaires et marketing ne sont activés qu'avec un <strong>consentement explicite</strong>.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="font-headline">13. Communications Commerciales</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>M.E Beauty ne pourra envoyer des communications électroniques à caractère informatif ou promotionnel qu'avec le <strong>consentement préalable et explicite</strong> du Client. Ce consentement peut être retiré à tout moment via le lien de désabonnement inclus dans chaque message ou en contactant directement le Prestataire.</p>
                        <p>L'envoi de communications aux clients actifs pourra se fonder sur un <strong>intérêt légitime</strong>, limité à des informations pertinentes sur les plans, les mises à jour ou des services similaires.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="font-headline">14. Mineurs</CardTitle></CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>Les services de M.E Experience sont <strong>exclusivement destinés aux personnes âgées de 18 ans ou plus</strong>. Aucune donnée de mineur ne sera collectée sciemment. En cas de collecte par inadvertance, les données seront immédiatement supprimées après détection.</p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle className="font-headline">15. Modifications de la Politique</CardTitle></CardHeader>
                    <CardContent className="text-muted-foreground">
                         <p>M.E Beauty se réserve le droit de modifier la présente Politique à tout moment, conformément aux mises à jour législatives, technologiques ou organisationnelles. La version la plus récente sera toujours disponible sur le site web <strong>www.me-experience.lu</strong>, avec indication de la date de révision. L'utilisation continue des services après la publication des modifications implique l'acceptation des nouvelles dispositions.</p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle className="font-headline">16. Réclamations et Autorité de Contrôle</CardTitle></CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>Pour toute question relative à la protection des données, le Client peut contacter : <strong>contact@me-experience.lu</strong></p>
                        <p>S'il estime que le traitement de ses données viole le RGPD, le Client a le droit de déposer une réclamation auprès de la : <strong>Commission Nationale pour la Protection des Données (CNPD)</strong>, 15 Boulevard du Jazz, L-4370 Belvaux, Luxembourg. <strong>www.cnpd.lu</strong></p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle className="font-headline">17. Loi Applicable et Juridiction Compétente</CardTitle></CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>La présente Politique est régie par la <strong>législation du Grand-Duché de Luxembourg</strong>, conformément au Règlement (UE) 2016/679 (RGPD) et à la loi nationale du 1er août 2018. Tout litige relatif à l'interprétation ou à l'exécution de cette Politique sera soumis à la <strong>juridiction exclusive du Tribunal d'arrondissement de Luxembourg-Ville</strong>, sauf disposition légale impérative contraire.</p>
                    </CardContent>
                </Card>

                <footer className="pt-8 mt-8 border-t text-center text-sm text-muted-foreground">
                    <p className="font-bold">M.E Experience — Operado por M.E Beauty S.à r.l.</p>
                    <p>20 Grand-Rue, L-3650 Tétange, Kayl, Luxembourg</p>
                    <p>RCS B286312 – EUID LURCSL.B286312 – TVA LU35923632</p>
                    <p>📧 contact@me-experience.lu</p>
                </footer>
            </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
