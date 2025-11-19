'use client';

import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Info, HeartPulse, Waves, Leaf, Wind, Ban, AlertTriangle, CheckCircle2, FileText, XCircle } from "lucide-react";

export default function ResponsibilityTermsPage() {
    const date = "17 novembre 2025";
    return (
        <>
            <Header />
            <main className="flex-grow bg-background">
                <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
                    <header className="mb-10 text-center">
                        <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
                        <h1 className="text-3xl font-bold md:text-4xl">Termes de Responsabilité</h1>
                        <p className="text-sm text-muted-foreground mt-2">Dernière mise à jour : {date}</p>
                    </header>

                    <div className="space-y-8">
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Identification et Champ d'Application</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>Les présents <strong>Termes de Responsabilité</strong> (ci-après "Termes") établissent le cadre juridique et informatif relatif à l'utilisation des services, équipements et installations offerts sous la désignation M.E Experience, propriété de et exploitée par la société <u>M.E Beauty S.à r.l.</u>, personne morale ayant son siège social au 20 Grand-Rue, L-3650 Tétange, Kayl, Luxembourg, immatriculée sous le numéro RCS B286312, avec l'EUID LURCSL.B286312 et le numéro d'identification fiscale TVA LU35923632 (ci-après le "Prestataire").</p>
                                <p>Les présents Termes régissent la responsabilité du Client dans l'utilisation des services de bien-être, d'esthétique et de relaxation offerts par M.E Experience, en établissant les conditions, limites, devoirs et exclusions applicables.</p>
                                <p>L'accès, la prise de rendez-vous, l'utilisation et la présence dans les installations de M.E Experience impliquent <strong>l'acceptation pleine, expresse et sans réserve</strong> des présents Termes, ainsi que des dispositions légales et réglementaires en vigueur au Grand-Duché de Luxembourg et dans l'Union Européenne.</p>
                                <p>Ces Termes font partie intégrante du cadre contractuel applicable au Client, complétant les Termes et Conditions d'Utilisation, la Politique de Confidentialité et la Politique de Remboursement de M.E Beauty.</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Objet et Finalité</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>Le présent document a pour objet de définir et de clarifier la nature non médicale des services fournis par M.E Experience, de décrire les risques et contre-indications inhérents à leur utilisation, et de formaliser le consentement éclairé du Client, par lequel celui-ci reconnaît et accepte, de manière libre, consciente et informée, les conditions d'utilisation, les responsabilités personnelles et les limites d'action du Prestataire.</p>
                                <Alert>
                                  <Info className="h-4 w-4" />
                                  <AlertTitle>Le but de ce Terme est de garantir que chaque Client comprenne que :</AlertTitle>
                                  <AlertDescription>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>les services fournis ont un caractère esthétique, préventif et de bien-être, non médical ;</li>
                                        <li>l'utilisation est volontaire et réalisée sous la responsabilité exclusive du Client ;</li>
                                        <li>le Prestataire n'assume aucune garantie de résultat ni ne répond des réactions, effets ou conséquences individuels, sauf preuve formelle de dol ou de négligence grave.</li>
                                    </ul>
                                  </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>3. Nature des Services et Exclusion d'Activité Médicale</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>M.E Experience est un centre de bien-être et d'esthétique de nature non médicale, spécialisé dans la fourniture de services de relaxation, de régénération cutanée et de stimulation corporelle au moyen d'équipements technologiques certifiés pour un usage cosmétique et de bien-être.</p>
                                <p>Les services offerts comprennent notamment le Collagen Boost (Thérapie par Lumière Rouge - RLT), l'Hydrojet (Massage par Hydrojet), le Dôme Infrarouge (Sauna à Infrarouges) et le Solarium (Banc Solaire), ainsi que d'autres traitements complémentaires de relaxation et d'esthétique non invasive.</p>
                                <p>Aucun service fourni par M.E Beauty :</p>
                                <ul className="list-disc list-inside pl-4 space-y-2">
                                    <li>ne constitue un acte médical ou thérapeutique ;</li>
                                    <li>n'est destiné à diagnostiquer, traiter, guérir ou prévenir des maladies ;</li>
                                    <li>ne remplace un suivi médical, kinésithérapeutique ou dermatologique ;</li>
                                    <li>ne produit de résultats garantis ou permanents.</li>
                                </ul>
                                <p>M.E Beauty agit strictement dans les limites légales de l'activité esthétique non médicale, conformément à la législation et à la réglementation européenne et luxembourgeoise en vigueur.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>4. Devoir d'Information et Auto-déclaration de Santé</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>Avant d'utiliser tout service, le Client s'engage à déclarer, de manière complète, véridique et à jour, son état de santé et toute condition susceptible d'interférer avec la prestation des services, notamment :</p>
                                <ul className="list-disc list-inside pl-4 space-y-2">
                                    <li>maladies cardiovasculaires, neurologiques, hormonales, métaboliques ou auto-immunes ;</li>
                                    <li>infections, plaies ouvertes, inflammations cutanées ou brûlures ;</li>
                                    <li>grossesse confirmée ou suspectée ;</li>
                                    <li>traitements médicaux en cours ou prise de médicaments photosensibilisants ;</li>
                                    <li>prothèses, implants métalliques, dispositifs électroniques internes (ex. : pacemaker) ;</li>
                                    <li>interventions chirurgicales ou esthétiques récentes.</li>
                                </ul>
                                <p>Le Client s'engage à consulter préalablement son médecin traitant en cas de doute sur son aptitude à effectuer toute procédure.</p>
                                 <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>L'omission, la fausseté ou la négligence dans la fourniture de ces informations engage la responsabilité exclusive du Client, exonérant M.E Beauty de toute conséquence, dommage physique, esthétique ou moral en découlant.</AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>5. Consentement Éclairé</CardTitle></CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>Le Client déclare avoir été dûment informé, de manière claire et compréhensible, sur :</p>
                                <ul className="list-disc list-inside pl-4 space-y-2">
                                    <li>la nature, le fonctionnement et les finalités de chaque traitement ;</li>
                                    <li>les instructions de sécurité, les risques, les précautions et les contre-indications ;</li>
                                    <li>les réactions indésirables ou effets secondaires possibles ;</li>
                                    <li>l'absence de garanties de résultats immédiats ou uniformes ;</li>
                                    <li>le caractère non thérapeutique et volontaire de l'utilisation des services.</li>
                                </ul>
                                <p>Le Client comprend que le consentement à la réalisation des services est donné librement et de manière informée, sans coercition, promesse de guérison, bénéfice garanti ou incitation de la part de M.E Beauty.</p>
                                <p>La poursuite de l'utilisation des services, que ce soit en personne ou par réservation en ligne, constitue une manifestation sans équivoque d'un consentement tacite, juridiquement valable et assimilé au consentement écrit, conformément au Règlement (UE) 910/2014 (eIDAS).</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>6. Risques et Limitations</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground space-y-4">
                               <p>Le Client reconnaît que l'utilisation des services, bien que sûre et non invasive, comporte des risques inhérents, contrôlés et de faible intensité, parmi lesquels :</p>
                                <ul className="list-disc list-inside pl-4 space-y-2">
                                    <li>rougeur, sécheresse, échauffement local, sensibilité cutanée ou fatigue musculaire ;</li>
                                    <li>transpiration intense et déshydratation (dans les services thermiques) ;</li>
                                    <li>irritation oculaire, sensibilité à la lumière ou maux de tête (dans les thérapies par la lumière) ;</li>
                                    <li>aggravation temporaire de conditions dermatologiques préexistantes ;</li>
                                    <li>réactions individuelles imprévisibles, variables d'une personne à l'autre.</li>
                                </ul>
                                <p>Le Client reconnaît que de tels effets, lorsqu'ils surviennent, sont généralement bénins et réversibles, et qu'ils ne constituent pas une défaillance du service, une négligence ou un manquement contractuel, à condition que les procédures aient été exécutées conformément aux normes de sécurité et aux recommandations techniques applicables.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>7. Contre-indications Spécifiques des Services</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-semibold text-lg text-foreground mb-2">7.1. Collagen Boost — Thérapie par Lumière Rouge (RLT)</h4>
                                    <p className="text-muted-foreground">Traitement de photobiomodulation cutanée. Contre-indications : grossesse, épilepsie photosensible, infections cutanées, maladies dermatologiques actives, utilisation de médicaments photosensibilisants ou traitements esthétiques récents. Le Client doit toujours utiliser des lunettes de protection, garder la peau propre et sans cosmétiques photosensibles, et interrompre immédiatement en cas d'inconfort.</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-semibold text-lg text-foreground mb-2">7.2. Hydrojet — Massage par Hydrojet</h4>
                                    <p className="text-muted-foreground">Thérapie par jets d'eau sous membrane flexible. Contre-indications : maladies cardiovasculaires graves, thrombose, varices avancées, diabète non équilibré, épilepsie, grossesse (1er trimestre), plaies ouvertes, fièvre ou infections. Précautions : grossesse après le 1er trimestre (avec avis médical), problèmes de dos, prothèses ou implants récents.</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-semibold text-lg text-foreground mb-2">7.3. Dôme Infrarouge — Sauna à Infrarouges</h4>
                                    <p className="text-muted-foreground">Thérapie thermique par rayonnement infrarouge à ondes longues. Contre-indications : sclérose en plaques, grossesse (surtout au 1er trimestre), fièvre, infections, maladies cardiovasculaires ou hypotension sévère. Le Client doit rester hydraté et interrompre l'utilisation en cas de vertige ou de malaise.</p>
                                </div>
                                 <Alert variant="destructive">
                                     <Ban className="h-4 w-4" />
                                     <AlertTitle>7.4. Solarium — Banc Solaire</AlertTitle>
                                     <AlertDescription>
                                        <p className="mb-2">L'exposition aux rayons ultraviolets (UV) artificiels comporte des risques avérés pour la santé de la peau et des yeux.</p>
                                        <p className="mt-2 font-semibold">Utilisation interdite ou déconseillée pour :</p>
                                        <ul className="list-disc list-inside pl-4 space-y-1">
                                            <li>les mineurs de 18 ans ;</li>
                                            <li>les personnes à peau de type I (très claire) ;</li>
                                            <li>les personnes ayant des antécédents de cancer de la peau, de mélanome ou de grains de beauté atypiques ;</li>
                                            <li>les femmes enceintes ;</li>
                                            <li>les utilisateurs de médicaments photosensibilisants ;</li>
                                            <li>les personnes souffrant de maladies cutanées aggravées par les UV.</li>
                                        </ul>
                                         <p className="mt-2 font-bold">Règles obligatoires : utilisation de lunettes de protection, durée maximale de 12 minutes, intervalle minimum de 48 heures entre les séances, pas de parfums ou de crèmes à base d'alcool avant l'exposition, et hydratation de la peau après la séance.</p>
                                     </AlertDescription>
                                 </Alert>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>8. Exonération et Limitation de Responsabilité</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground space-y-4">
                                <p>M.E Beauty, ses administrateurs, collaborateurs et représentants ne pourront être tenus pour responsables, directement ou indirectement, de :</p>
                                <ul className="list-disc list-inside pl-4 space-y-2">
                                    <li>réactions indésirables, brûlures, irritations, inconforts ou lésions résultant d'une utilisation inappropriée des équipements ;</li>
                                    <li>l'aggravation de pathologies préexistantes non déclarées ;</li>
                                    <li>les effets découlant du non-respect des instructions et contre-indications ;</li>
                                    <li>les défaillances techniques, les interruptions d'électricité, les cas de force majeure ou les causes externes indépendantes de la volonté du Prestataire ;</li>
                                    <li>les attentes personnelles de résultat non satisfaites.</li>
                                </ul>
                                <p>La responsabilité du Prestataire se limite au respect des normes de sécurité et à l'entretien des équipements, conformément à la diligence professionnelle requise.</p>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>9. Consentement Implicite et Caractère Contraignant</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>En effectuant une réservation, un abonnement ou un paiement via la plateforme numérique, ainsi qu'en accédant physiquement aux installations de M.E Experience, le Client déclare expressément avoir lu, compris et accepté les présents Termes de Responsabilité, et que son consentement a une valeur juridique contraignante. Cet accord remplace la nécessité d'une signature manuscrite, conformément à la législation luxembourgeoise et européenne sur le consentement électronique.</p>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>10. Mises à Jour et Modifications</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>M.E Beauty se réserve le droit de modifier, compléter ou mettre à jour le contenu de ces Termes de Responsabilité à tout moment, en fonction des évolutions techniques, légales ou réglementaires. Les nouvelles versions entrent en vigueur à la date de leur publication sur la plateforme www.me-experience.lu et sont considérées comme acceptées par la poursuite de l'utilisation des services.</p>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>11. Loi Applicable et Juridiction Compétente</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>Les présents Termes sont régis par la législation du Grand-Duché de Luxembourg, conformément au Code civil luxembourgeois, à la directive 2011/83/UE et aux dispositions relatives à la protection des consommateurs et à la responsabilité civile. Tout litige découlant de l'interprétation ou de l'exécution de ces Termes sera soumis à la juridiction exclusive du Tribunal d'arrondissement de Luxembourg-Ville, sauf disposition légale impérative contraire.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <footer className="pt-10 mt-10 border-t text-center text-sm text-muted-foreground">
                        <p className="font-bold">M.E Experience — Operado por M.E Beauty S.à r.l.</p>
                        <p>20 Grand-Rue, L-3650 Tétange, Kayl, Luxembourg</p>
                        <p>RCS B286312 – EUID LURCSL.B286312 – TVA LU35923632</p>
                        <p>📧 contact@me-experience.lu</p>
                    </footer>
                </div>
            </main>
            <Footer />
        </>
    );
}
