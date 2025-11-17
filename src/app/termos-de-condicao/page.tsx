
'use client';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, FileText, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function TermsAndConditionsPage() {
  const date = "17 novembre 2025";

  return (
    <>
      <Header />
      <main className="flex-grow bg-secondary/30">
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
          
          <Card className="overflow-hidden shadow-lg">
            <CardHeader className="bg-background">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-grow">
                  <CardTitle className="text-3xl font-bold">Termes et Conditions d'Utilisation</CardTitle>
                  <CardDescription className="mt-1">Dernière mise à jour : {date}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-8 bg-background">
              
              {/* Section 1 */}
              <section id="identification">
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Identification et Champ d'Application</h2>
                <div className="space-y-4 text-muted-foreground">
                    <p>Les présents Termes et Conditions d'Utilisation (ci-après "Termes") régissent l'utilisation de la plateforme de prise de rendez-vous en ligne et de souscription numérique désignée M.E Experience, propriété de et exploitée par la société M.E Beauty, personne morale ayant son siège social au 20 Grand-Rue, L-3650 Tétange, Kayl, Luxembourg, immatriculée sous le numéro RCS B286312, avec l'EUID LURCSL.B286312 et le numéro d'identification fiscale TVA LU35923632 (ci-après le "Prestataire").</p>
                    <p>L'accès, la navigation et l'utilisation de la Plateforme (y compris ses sous-domaines et applications mobiles) impliquent l'acceptation pleine et entière des présents Termes par l'utilisateur ("Client" ou "Utilisateur"), ainsi que l'engagement de respecter toutes les dispositions légales et réglementaires applicables au Grand-Duché de Luxembourg et dans l'Union Européenne.</p>
                    <p>Ces Termes constituent un contrat d'adhésion conclu entre M.E Beauty et le Client, ayant une valeur juridique équivalente à un contrat signé sur support physique, et prévalent sur tout document contradictoire émis par le Client.</p>
                </div>
              </section>

              <Separator />

              {/* Section 2 */}
              <section id="objet">
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Objet et Nature des Services</h2>
                <div className="space-y-4 text-muted-foreground">
                    <p>La Plateforme M.E Experience a pour objet de fournir au Client :</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>L'acquisition de plans de souscription mensuels et des services associés ;</li>
                        <li>La prise et la gestion de rendez-vous pour des traitements et des séances de bien-être ;</li>
                        <li>La réalisation de paiements en ligne via le prestataire externe Stripe Payments Europe Ltd. ;</li>
                        <li>L'accès à des informations, recommandations, historique de consommation et gestion personnelle du solde de minutes.</li>
                    </ul>
                    <p>Le Prestataire se réserve le droit de modifier, suspendre, altérer ou supprimer, temporairement ou définitivement, toute fonctionnalité ou service offert, sans que cela ne constitue, en aucun cas, un droit à indemnisation ou compensation pour le Client, sauf disposition impérative contraire.</p>
                </div>
              </section>

              <Separator />
              
              {/* Section 3 */}
              <section id="acces">
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Conditions d'Accès et Création de Compte</h2>
                <div className="space-y-4 text-muted-foreground">
                    <p><strong>3.1.</strong> L'accès à la Plateforme est libre, mais l'utilisation des services nécessite un enregistrement préalable et la création d'un compte personnel.</p>
                    <p><strong>3.2.</strong> Au moment de l'enregistrement, le Client doit fournir des données véridiques, complètes et à jour, incluant nom, prénom, adresse de courrier électronique, numéro de téléphone et date de naissance.</p>
                    <p><strong>3.3.</strong> Le Client déclare être majeur (18 ans) et posséder la pleine capacité juridique pour contracter. Le Prestataire se réserve le droit de demander une preuve d'identité à tout moment.</p>
                    <p><strong>3.4.</strong> Le Client s'engage à maintenir la confidentialité de ses identifiants d'accès et reconnaît que toute utilisation effectuée via son compte sera présumée comme étant de son fait. M.E Beauty ne pourra être tenue responsable des pertes ou dommages résultant d'un usage abusif du compte, de négligence ou du partage des identifiants.</p>
                    <p><strong>3.5.</strong> Le Prestataire pourra suspendre ou clôturer le compte du Client, avec ou sans préavis, en cas de :</p>
                    <ul className="space-y-3 pl-4">
                        <li className="flex items-start"><XCircle className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" /><span>Non-respect des présents Termes ;</span></li>
                        <li className="flex items-start"><XCircle className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" /><span>Fraude, abus, manipulation de réservations ou tentative d'intrusion ;</span></li>
                        <li className="flex items-start"><XCircle className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" /><span>Comportement offensant, diffamatoire ou préjudiciable à la réputation de l'entreprise ;</span></li>
                        <li className="flex items-start"><XCircle className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" /><span>Obligation légale ou ordre administratif ou judiciaire.</span></li>
                    </ul>
                    <p>La suppression du compte entraîne la cessation immédiate de tous les services associés, sans remboursement des sommes déjà facturées, sauf disposition expresse contraire.</p>
                </div>
              </section>

              <Separator />

              {/* Section 4 */}
              <section id="souscriptions">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">4. Souscriptions, Paiements et Renouvellements</h2>
                  <div className="space-y-4 text-muted-foreground">
                      <p><strong>4.1.</strong> Le Client peut souscrire à des plans mensuels moyennant un paiement anticipé, donnant lieu à une souscription automatique et récurrente, traitée par le système Stripe, qui gère le débit périodique du montant correspondant.</p>
                      <p><strong>4.2.</strong> En adhérant à un plan, le Client autorise expressément Stripe et M.E Beauty à procéder au prélèvement automatique sur le mode de paiement indiqué, jusqu'à l'annulation volontaire de la souscription par le Client.</p>
                      <p><strong>4.3.</strong> Tous les prix indiqués sur la Plateforme incluent la TVA au taux légal en vigueur au Luxembourg, sauf indication contraire explicite.</p>
                      <p><strong>4.4.</strong> En cas d'échec de paiement, de refus de prélèvement, de carte expirée ou de fonds insuffisants, le compte pourra être suspendu jusqu'à régularisation.</p>
                      <p><strong>4.5.</strong> M.E Beauty se réserve le droit de modifier les tarifs des souscriptions, en communiquant une telle modification avec un préavis minimum de 15 jours. La poursuite de l'utilisation après cette date constitue une acceptation tacite du nouveau tarif.</p>
                      <p><strong>4.6.</strong> Les souscriptions ne sont ni transmissibles ni cessibles à des tiers. Le Client reconnaît que chaque plan est strictement personnel et non transférable.</p>
                  </div>
              </section>

              <Separator />

              {/* Section 5 */}
              <section id="agendamentos">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">5. Rendez-vous, Annulations et Pénalités</h2>
                  <div className="space-y-4 text-muted-foreground">
                      <p><strong>5.1.</strong> Le Client pourra prendre des rendez-vous selon les disponibilités affichées sur la Plateforme. Chaque réservation est contraignante et constitue un engagement de présence.</p>
                      <p><strong>5.2.</strong> Le Client peut annuler ou reporter une séance directement via son compte. Les conditions d'annulation sont les suivantes :</p>
                      
                      <Alert variant="default" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-800 dark:text-green-300 font-semibold">Annulation +24h</AlertTitle>
                          <AlertDescription className="text-green-700 dark:text-green-400">
                            Annulation avec plus de 24 heures d'antecedence: droit au remboursement total du montant payé ou à la restitution intégrale des minutes.
                          </AlertDescription>
                      </Alert>

                      <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertTitle className="text-yellow-800 dark:text-yellow-300 font-semibold">Annulation -24h</AlertTitle>
                          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                            Annulation dans les 24 heures précédant le rendez-vous: remboursement partiel de 50 % ou déduction proportionnelle des minutes.
                          </AlertDescription>
                      </Alert>
                      
                       <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertTitle className="font-semibold">Absence ("No-Show")</AlertTitle>
                          <AlertDescription>
                            Après l'heure prévue ou en cas d'absence ("no-show"): perte totale du montant payé et des minutes correspondantes.
                          </AlertDescription>
                      </Alert>
                      
                      <p><strong>5.3.</strong> L'annulation n'est considérée comme effective qu'après confirmation électronique émise par la Plateforme.</p>
                      <p><strong>5.4.</strong> M.E Beauty se réserve le droit de modifier ou d'annuler unilatéralement un rendez-vous pour des raisons techniques, d'indisponibilité de l'équipement, de force majeure ou d'absence justifiée d'un professionnel. Dans ces cas, le Client pourra choisir entre un report sans frais ou un remboursement intégral.</p>
                      <p><strong>5.5.</strong> En aucune circonstance, le Prestataire ne pourra être tenu responsable des dommages indirects résultant de l'annulation, tels que la perte de temps, les frais de déplacement, les dommages moraux ou les manques à gagner.</p>
                  </div>
              </section>

              <Separator />
              
              {/* Section 6 */}
              <section id="retractation">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">6. Droit de Rétractation</h2>
                  <div className="space-y-4 text-muted-foreground">
                      <p><strong>6.1.</strong> Conformément à la Directive 2011/83/UE et au Code de la Consommation luxembourgeois, le Client dispose d'un délai de 14 jours à compter de la date d'adhésion pour exercer son droit de rétractation, sans avoir à justifier de motifs.</p>
                      <p><strong>6.2.</strong> Ce droit n'est pas applicable si le Client demande expressément le début de la prestation avant la fin dudit délai, reconnaissant qu'en commençant à utiliser la souscription ou en effectuant le premier rendez-vous, il renonce à son droit de rétractation.</p>
                      <p><strong>6.3.</strong> L'exercice du droit de rétractation doit être communiqué par écrit à contact@me-experience.lu, en indiquant le nom complet, l'email d'enregistrement et le plan souscrit.</p>
                  </div>
              </section>

               <Separator />

              {/* Section 7 */}
              <section id="responsabilidade">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">7. Garanties, Limitations et Exonérations de Responsabilité</h2>
                   <div className="space-y-4 text-muted-foreground">
                        <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                           <ShieldCheck className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold">Avis Important</AlertTitle>
                          <AlertDescription className="text-blue-700 dark:text-blue-400">
                            Tous les services offerts par M.E Beauty sont de nature esthétique et de bien-être, et ne constituent en aucun cas un acte médical, un diagnostic clinique ou thérapeutique.
                          </AlertDescription>
                        </Alert>
                        <p><strong>7.2.</strong> Le Client déclare avoir été informé que l'efficacité et les résultats varient d'une personne à l'autre, en fonction de facteurs biologiques, comportementaux et de santé, et que des résultats spécifiques, permanents ou uniformes ne sont pas garantis.</p>
                        <p><strong>7.3.</strong> Le Prestataire ne sera pas responsable des :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                           <li>Dommages résultant d'une utilisation incorrecte, négligente ou non conforme aux instructions ;</li>
                           <li>Réactions indésirables dues à des conditions médicales préexistantes non communiquées ;</li>
                           <li>Interruptions de service causées par des tiers (ex. : pannes de Stripe, fournisseurs, réseau, serveur) ;</li>
                           <li>Cas fortuit, force majeure, décisions administratives ou catastrophes naturelles.</li>
                        </ul>
                         <p><strong>7.4.</strong> Le Client s'engage à respecter toutes les recommandations de sécurité et les contre-indications médicales figurant dans les Termes, assumant l'entière responsabilité de l'utilisation des équipements et installations.</p>
                   </div>
              </section>

              <Separator />

              {/* Section 8 */}
              <section id="obligations">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">8. Obligations du Client</h2>
                  <div className="space-y-4 text-muted-foreground">
                      <p><strong>8.1.</strong> Le Client s'engage à utiliser la Plateforme et les services de manière éthique, sécurisée et conforme à la loi, en s'abstenant de :</p>
                      <ul className="list-disc list-inside space-y-2 pl-4">
                          <li>Diffuser du contenu illicite, diffamatoire, obscène ou trompeur ;</li>
                          <li>Violer les droits de propriété intellectuelle de M.E Beauty ou de tiers ;</li>
                          <li>Pratiquer des actes pouvant endommager, surcharger ou compromettre le fonctionnement de la Plateforme ;</li>
                          <li>Reproduire, copier ou exploiter commercialement toute partie du contenu ou du logiciel sans autorisation écrite.</li>
                      </ul>
                      <p><strong>8.2.</strong> Le non-respect de l'une de ces obligations pourra entraîner la suspension ou la résiliation immédiate du compte et une éventuelle responsabilité civile ou pénale.</p>
                  </div>
              </section>

              <Separator />

              {/* Section 9 */}
              <section id="propriete">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">9. Propriété Intellectuelle</h2>
                  <div className="space-y-4 text-muted-foreground">
                      <p><strong>9.1.</strong> Tous les éléments qui composent la Plateforme — design, mise en page, logos, textes, photographies, vidéos, logiciel et code source — sont la propriété exclusive de M.E Beauty, protégés par les droits d'auteur et la propriété industrielle.</p>
                      <p><strong>9.2.</strong> Aucun contenu ne pourra être copié, reproduit, republié, transmis, affiché ou distribué, en tout ou en partie, sans l'autorisation préalable et écrite du titulaire.</p>
                      <p><strong>9.3.</strong> Le nom commercial "M.E Experience" est une marque déposée. Toute utilisation abusive sera susceptible de poursuites judiciaires pour violation de marque et concurrence déloyale.</p>
                  </div>
              </section>

              <Separator />

              {/* Section 10 */}
              <section id="suspension">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">10. Suspension et Résiliation du Service</h2>
                  <div className="space-y-4 text-muted-foreground">
                      <p><strong>10.1.</strong> Le Prestataire pourra, à tout moment et sans préavis, suspendre ou interrompre la Plateforme pour des raisons techniques, de sécurité, de maintenance ou de force majeure.</p>
                      <p><strong>10.2.</strong> En cas de fermeture définitive, M.E Beauty communiquera avec les Clients actifs, avec un préavis minimum de 30 jours, en assurant le remboursement proportionnel des montants non utilisés.</p>
                      <p><strong>10.3.</strong> La résiliation pour manquement imputable au Client ne confère aucun droit à une quelconque compensation ou restitution.</p>
                  </div>
              </section>

              <Separator />

              {/* Section 11 */}
              <section id="modifications">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">11. Modifications Contractuelles</h2>
                  <div className="space-y-4 text-muted-foreground">
                      <p><strong>11.1.</strong> M.E Beauty se réserve le droit de modifier unilatéralement ces Termes, en notifiant les Clients par email ou via la Plateforme.</p>
                      <p><strong>11.2.</strong> Les modifications entrent en vigueur à la date indiquée dans la communication. L'utilisation continue de la Plateforme après cette date constitue une acceptation tacite des nouvelles conditions.</p>
                      <p><strong>11.3.</strong> Si le Client n'est pas d'accord, il pourra cesser l'utilisation et demander la clôture de son compte, en respectant les délais contractuels applicables.</p>
                  </div>
              </section>

              <Separator />

              {/* Section 12 */}
              <section id="force-majeure">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">12. Force Majeure</h2>
                  <div className="space-y-4 text-muted-foreground">
                      <p>Aucune des parties ne sera responsable d'un manquement contractuel dû à un événement de force majeure, y compris, mais sans s'y limiter : pannes électriques, incendie, inondations, pandémies, guerre, grève, décisions gouvernementales, indisponibilité des fournisseurs ou catastrophes naturelles. Pendant ces périodes, les obligations sont suspendues jusqu'à la normalisation de la situation.</p>
                  </div>
              </section>

              <Separator />

              {/* Section 13 */}
              <section id="loi-applicable">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">13. Loi Applicable et Juridiction Compétente</h2>
                  <div className="space-y-4 text-muted-foreground">
                      <p>Les présents Termes sont régis par la législation du Grand-Duché de Luxembourg. Tout litige relatif à leur interprétation, validité ou exécution sera soumis à la juridiction exclusive des Tribunaux de l'arrondissement de Luxembourg-Ville, sans préjudice des dispositions impératives en matière de protection des consommateurs.</p>
                  </div>
              </section>

              <Separator />

              {/* Section 14 */}
              <section id="dispositions-finales">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">14. Dispositions Finales</h2>
                  <div className="space-y-4 text-muted-foreground">
                      <p><strong>14.1.</strong> La nullité partielle d'une clause n'affectera pas la validité des autres.</p>
                      <p><strong>14.2.</strong> La version publiée sur la Plateforme prévaut sur toute version antérieure.</p>
                      <p><strong>14.3.</strong> Le Client reconnaît que ce document constitue l'accord intégral entre les parties, remplaçant toutes négociations ou communications antérieures, orales ou écrites.</p>
                  </div>
              </section>
              
               {/* Footer Information */}
                <Separator />
                <div className="pt-6 text-center text-sm text-muted-foreground">
                    <p className="font-bold text-base text-foreground">📄 M.E Beauty S.à r.l.</p>
                    <p>20 Grand-Rue, L-3650 Tétange, Kayl, Luxembourg</p>
                    <p>RCS B286312 – EUID LURCSL.B286312 – TVA LU35923632</p>
                    <p>📧 contact@me-experience.lu</p>
                </div>

            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
