'use client';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, FileText } from "lucide-react";

export default function RefundPolicyPage() {
  const date = "17 novembre 2025";

  return (
    <>
      <Header />
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
            <header className="mb-10 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="text-3xl font-bold md:text-4xl">Politique de Remboursement</h1>
                <p className="text-sm text-muted-foreground mt-2">Dernière mise à jour : {date}</p>
            </header>

            <div className="space-y-8">
                
                <Card>
                    <CardHeader>
                        <CardTitle>1. Identification et Champ d'Application</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>La présente <strong>Politique de Remboursement</strong> (ci-après "Politique") régit les conditions d'annulation, de retour et de restitution de montants relatifs aux services, abonnements et rendez-vous effectués via la plateforme numérique M.E Experience, exploitée par la société <strong>M.E Beauty S.à r.l.</strong>, personne morale ayant son siège social au 20 Grand-Rue, L-3650 Tétange, Kayl, Luxembourg, immatriculée sous le numéro RCS B286312, avec l'EUID LURCSL.B286312 et le numéro d'identification fiscale TVA LU35923632 (ci-après le "Prestataire" ou "M.E Beauty").</p>
                        <p>Cette Politique s'applique à tous les Clients ("Client" ou "Utilisateur") qui effectuent des paiements, des réservations ou des abonnements via la Plateforme, que ce soit en ligne ou dans les locaux de M.E Experience.</p>
                        <p>L'utilisation de la Plateforme ou la réalisation de tout paiement implique <strong>l'acceptation pleine et entière</strong> de la présente Politique.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Objet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                         <p>Le présent document a pour objet d'établir les règles relatives au droit d'annulation, au remboursement total ou partiel, ainsi qu'aux situations où le remboursement n'est pas applicable, garantissant la conformité avec les normes du <strong>Code de la Consommation luxembourgeois</strong> et de la <strong>Directive 2011/83/UE</strong> sur les droits des consommateurs.</p>
                         <p>M.E Beauty s'engage à appliquer les principes de <strong>transparence, d'équité et de diligence</strong> dans toutes les demandes de remboursement, dans les limites définies par ce document et les conditions spécifiques de chaque service.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>3. Nature des Services et Limitations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Les services offerts par M.E Experience sont de nature <strong>immatérielle et personnalisée</strong>, consistant en :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>la prise de rendez-vous pour des soins esthétiques et de bien-être ;</li>
                            <li>des abonnements mensuels avec un crédit en minutes ;</li>
                            <li>des services complémentaires de relaxation et de régénération cutanée.</li>
                        </ul>
                        <p>S'agissant de services fournis sur rendez-vous et avec un temps réservé, le Client reconnaît que l'exécution du service commence au moment de la réservation confirmée, et que sa modification ou son annulation implique un <strong>blocage de l'agenda</strong> et une occupation des équipements et des ressources humaines.</p>
                        <p>Par conséquent, des restrictions spécifiques s'appliquent au droit de remboursement, comme défini dans les sections suivantes.</p>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>4. Annulation des Rendez-vous</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Le Client peut annuler ou reporter ses rendez-vous via son compte personnel sur la Plateforme ou en contactant directement le Prestataire, en respectant les délais et conditions suivants :</p>
                        <div className="space-y-3">
                            <h4 className="font-semibold text-foreground">4.1. Annulation plus de 24 heures à l'avance</h4>
                            <p>Le Client a droit au <strong>remboursement total</strong> du montant payé, ou à la restitution intégrale des minutes correspondantes, selon la modalité de l'abonnement.</p>
                            <p>Le remboursement sera effectué par le même moyen de paiement que celui utilisé lors de la transaction initiale.</p>
                            
                            <h4 className="font-semibold text-foreground pt-2">4.2. Annulation dans les 24 heures précédant l'heure du rendez-vous</h4>
                            <p>Le Client aura droit à un <strong>remboursement partiel de 50%</strong> du montant payé, ou à une déduction proportionnelle des minutes (la moitié du temps réservé).</p>
                            <p>Le montant restant est retenu à titre de compensation pour l'indisponibilité générée dans l'agenda et les coûts opérationnels engagés.</p>

                            <h4 className="font-semibold text-foreground pt-2">4.3. Annulation après l'heure du rendez-vous ou absence ("no-show")</h4>
                            <p>Le Client <strong>perd intégralement le droit</strong> au remboursement ou à la restitution des minutes.</p>
                            <p>Le montant est considéré comme dû et non remboursable, au titre du service réservé et non utilisé.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>5. Annulation des Abonnements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Les abonnements mensuels sont des services continus et <strong>renouvelables automatiquement</strong> via la plateforme de paiement Stripe Payments Europe Ltd.</p>
                        <h4 className="font-semibold text-foreground">5.1. Annulation par le Client</h4>
                        <p>Le Client peut, à tout moment, annuler le renouvellement automatique de son abonnement directement depuis son compte ou sur demande écrite à M.E Beauty.</p>
                        <p>L'annulation ne prendra effet qu'au <strong>cycle de facturation suivant</strong>, sans remboursement proportionnel pour les périodes déjà entamées.</p>

                        <h4 className="font-semibold text-foreground pt-2">5.2. Annulation par le Prestataire</h4>
                        <p>M.E Beauty pourra annuler unilatéralement un abonnement en cas de :</p>
                         <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>manquement contractuel ou fraude ;</li>
                            <li>irrégularité de paiement ou carte refusée ;</li>
                            <li>décision administrative, de sécurité ou de maintenance technique.</li>
                         </ul>
                         <p>Dans ces cas, le <strong>remboursement proportionnel</strong> des montants payés et non utilisés sera garanti, sauf en cas de dol ou d'abus de la part du Client.</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>6. Services Commencés ou Déjà Fournis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                         <p>Conformément à l'article 16 de la Directive 2011/83/UE, le droit de rétractation ne s'applique pas aux services qui :</p>
                         <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>ont été <strong>pleinement exécutés</strong> avec le consentement préalable du consommateur ;</li>
                            <li>ont un caractère <strong>personnalisé</strong> ou adapté au client ;</li>
                            <li>impliquent la mise à disposition immédiate d'un avantage numérique (minutes, crédits, accès).</li>
                         </ul>
                         <p>Ainsi, une fois le soin commencé ou le temps d'abonnement utilisé, il n'y a <strong>aucun droit à remboursement</strong>.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>7. Modalités et Délai de Remboursement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Les remboursements, lorsqu'applicables, seront traités de la manière suivante :</p>
                         <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>En utilisant le <strong>même moyen de paiement</strong> que celui de la transaction initiale (carte de crédit, débit, etc.) ;</li>
                            <li>Dans un délai maximum de <strong>10 jours ouvrables</strong> à compter de la date de confirmation de l'annulation ;</li>
                            <li>Avec une notification électronique envoyée au Client, contenant le justificatif de l'opération.</li>
                         </ul>
                        <p>M.E Beauty ne pourra être tenue responsable des retards imputables aux intermédiaires financiers, aux banques émettrices ou aux délais opérationnels de Stripe.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>8. Exceptions et Cas Particuliers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p><strong>Aucun droit à remboursement</strong> ne sera accordé dans les situations suivantes :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                           <li>utilisation abusive des services ou violation des Termes et Conditions ;</li>
                            <li>absence non justifiée ou annulation hors des délais établis ;</li>
                            <li>impossibilité technique ou médicale du Client non communiquée au préalable ;</li>
                            <li>promotions, remises ou offres spéciales clairement indiquées comme <strong>non remboursables</strong> ;</li>
                            <li>cartes-cadeaux ou bons déjà utilisés, partiellement ou totalement.</li>
                        </ul>
                        <p>En cas de motif médical dûment justifié (attestation médicale), un remboursement proportionnel ou une conversion en crédit pour une utilisation future pourra être analysé à titre exceptionnel.</p>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader><CardTitle>9. Modifications, Pannes Techniques ou Annulation par le Prestataire</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>M.E Beauty se réserve le droit de modifier ou d'annuler unilatéralement des rendez-vous ou des séances dans les cas suivants :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>pannes techniques des équipements ;</li>
                            <li>indisponibilité des professionnels ;</li>
                            <li>cas de force majeure (énergie, santé publique, événements climatiques) ;</li>
                            <li>réorganisation de l'agenda pour maintenance ou sécurité.</li>
                        </ul>
                        <p>Dans ces cas, le Client sera contacté et pourra choisir entre :</p>
                         <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>un <strong>report sans frais</strong> supplémentaires, ou</li>
                            <li>un <strong>remboursement intégral</strong> du montant payé, traité dans un délai de 10 jours ouvrables.</li>
                         </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>10. Procédure de Demande de Remboursement</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Toutes les demandes de remboursement doivent être formalisées par écrit à <strong>contact@me-experience.lu</strong>, en indiquant :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                           <li>Nom complet ;</li>
                            <li>Email d'inscription ;</li>
                            <li>Date et numéro de la réservation ou de l'abonnement ;</li>
                            <li>Motif de la demande et documentation pertinente (le cas échéant).</li>
                        </ul>
                        <p>Les demandes incomplètes ou sans éléments vérifiables pourront être rejetées. Le Prestataire se réserve le droit de demander des justificatifs supplémentaires avant de procéder au remboursement.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>11. Droit de Rétractation</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Conformément à l'article <strong>L.222-9 du Code de la Consommation</strong> luxembourgeois et à la Directive 2011/83/UE, le Client dispose d'un délai de <strong>14 jours</strong> pour exercer son droit de rétractation sur les services contractés à distance, sauf si le service a commencé à être exécuté avec son consentement exprès avant la fin de ce délai.</p>
                        <p>En effectuant une réservation immédiate ou en utilisant les minutes de son abonnement, le Client <strong>renonce expressément à son droit de rétractation</strong>, reconnaissant la nature personnalisée et immédiate du service.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>12. Remboursements en Cas d'Erreur de Paiement</CardTitle></CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>En cas de double facturation, d'erreur technique ou de débit indu, le Client devra notifier M.E Beauty dans un délai maximum de <strong>15 jours</strong> après la date de la transaction. Une fois l'erreur confirmée, le remboursement sera intégralement traité sur le même moyen de paiement. L'absence de communication dans ce délai pourrait empêcher la restitution.</p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle>13. Politique de Crédits et de Substitution</CardTitle></CardHeader>
                    <CardContent className="text-muted-foreground">
                         <p>En alternative au remboursement monétaire, M.E Beauty pourra, à sa discrétion, émettre des <strong>crédits équivalents</strong> pour une utilisation future sur les services de M.E Experience, valables pour une période maximale de <strong>90 jours</strong>. Les crédits non utilisés dans ce délai expireront automatiquement, sans droit à un remboursement supplémentaire.</p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle>14. Dispositions Finales</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p><strong>14.1.</strong> La présente Politique doit être interprétée conjointement avec les Termes et Conditions d'Utilisation, la Politique de Confidentialité et les Termes de Responsabilité de M.E Experience.</p>
                        <p><strong>14.2.</strong> Toute exception ou tolérance accordée par M.E Beauty dans des cas spécifiques ne constitue pas une renonciation à ses droits ni ne modifie l'application générale de cette Politique.</p>
                        <p><strong>14.3.</strong> M.E Beauty se réserve le droit de modifier, compléter ou mettre à jour cette Politique à tout moment. Les nouvelles versions seront publiées sur le site www.me-experience.lu et applicables dès leur date de publication.</p>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader><CardTitle>15. Loi Applicable et Juridiction Compétente</CardTitle></CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>La présente Politique est régie par la <strong>législation du Grand-Duché de Luxembourg</strong>, conformément au Code Civil luxembourgeois et à la Directive 2011/83/UE. Tout litige découlant de son interprétation ou de son application sera soumis à la <strong>juridiction exclusive du Tribunal d'arrondissement de Luxembourg-Ville</strong>, sans préjudice des règles impératives de protection des consommateurs.</p>
                    </CardContent>
                </Card>

                <footer className="pt-8 mt-8 border-t text-center text-sm text-muted-foreground">
                    <p className="font-bold">📄 M.E Beauty S.à r.l.</p>
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
