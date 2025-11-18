'use client';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Info, HeartPulse, Waves, Leaf, Wind, Ban, AlertTriangle, CheckCircle2, FileText } from "lucide-react";

export default function ResponsibilityTermsPage() {
    return (
        <>
            <Header />
            <main className="flex-grow bg-background">
                <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
                    <header className="mb-10 text-center">
                        <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
                        <h1 className="text-3xl font-bold md:text-4xl">Termes de Responsabilité</h1>
                        <p className="text-sm text-muted-foreground mt-2">Dernière mise à jour : 17 novembre 2025</p>
                    </header>

                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Objet et Finalité</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>Les présents Termes de Responsabilité ont pour objectif de définir, avec exactitude et exhaustivité, le cadre juridique applicable à l'utilisation des services, équipements, installations et traitements fournis par M.E Experience, opérée par la société M.E Beauty S.à r.l., en délimitant les responsabilités des deux parties et les conditions sous lesquelles le Client consent, de manière libre, éclairée et informée, à l'utilisation de services de nature esthétique, préventive et de bien-être non médicale.</p>
                                <p>Ce document intègre et complète les <strong>Termes et Conditions d'Utilisation</strong> de M.E Experience, constituant une extension obligatoire de ceux-ci, et est également contraignant pour tous les Clients, Utilisateurs et Visiteurs.</p>
                                <Alert>
                                  <Info className="h-4 w-4" />
                                  <AlertDescription>La lecture intégrale et attentive du présent texte est une condition préalable et essentielle à l'utilisation des services offerts, que ce soit en ligne ou en personne.</AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>2. Nature des Services et Exclusion d'Activité Médicale</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>M.E Experience est un centre de bien-être et d'esthétique non médicale, spécialisé dans les thérapies de relaxation, de régénération cutanée et d'équilibre corporel, fournies par des équipements certifiés pour un usage esthétique et récréatif.</p>
                                <p>La nature des services fournis est strictement <strong>non clinique et non thérapeutique.</strong> Aucun service offert par M.E Beauty n'est destiné à :</p>
                                <ul className="list-disc list-inside pl-4 space-y-2">
                                    <li>Diagnostiquer, traiter, guérir ou prévenir des maladies ;</li>
                                    <li>Remplacer un avis médical, kinésithérapeutique ou dermatologique ;</li>
                                    <li>Produire des effets cliniques garantis ;</li>
                                    <li>Attribuer au Client des résultats esthétiques, métaboliques ou physiologiques déterminés.</li>
                                </ul>
                                <p>Le Client reconnaît expressément que tous les services fournis sont de nature complémentaire, volontaire et récréative, et ne relèvent pas des pratiques médicales réglementées par le Code de la Santé du Luxembourg.</p>
                                <p>Le Prestataire s'engage à respecter toutes les normes de sécurité, d'hygiène et de maintenance des équipements, mais l'utilisation des services est faite aux risques et périls du Client, sur la base d'un consentement éclairé et sous sa seule responsabilité personnelle.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>3. Devoir d'Autodéclaration et Responsabilité Personnelle</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>Le Client, en s'inscrivant sur la plateforme, en prenant un rendez-vous ou en utilisant toute installation de M.E Experience, déclare sur l'honneur que :</p>
                                <ul className="list-disc list-inside pl-4 space-y-2">
                                    <li>Il se trouve en bonnes conditions physiques et mentales ;</li>
                                    <li>Il ne présente pas de maladies cardiovasculaires, neurologiques, auto-immunes, d'infections, de plaies ouvertes, d'inflammations cutanées, de fièvre, de problèmes hormonaux ou toute autre condition incompatible avec l'utilisation d'équipements thermiques, lumineux ou de pression ;</li>
                                    <li>Il n'est pas enceinte ou, si c'est le cas, s'engage à s'abstenir d'utiliser tout service sans avis médical préalable et écrit ;</li>
                                    <li>Il n'utilise pas de médicaments photosensibilisants, antibiotiques, antidépresseurs, anti-inflammatoires, diurétiques, statines, isotrétinoïne, hormones, anesthésiques topiques ou tout autre médicament susceptible d'interagir négativement avec les rayonnements infrarouges, la lumière LED ou la chaleur ;</li>
                                    <li>Il n'est pas sous l'influence d'alcool, de stupéfiants ou de stimulants pendant la réalisation de toute séance.</li>
                                </ul>
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Important</AlertTitle>
                                    <AlertDescription>Le Client est conscient que l'omission, la négligence ou la fausseté dans les informations fournies constitue un acte de responsabilité personnelle et directe, excluant intégralement la responsabilité civile, médicale ou pénale de M.E Beauty.</AlertDescription>
                                </Alert>
                                <p>Le Client s'engage, en outre, à communiquer avant chaque séance toute modification de son état de santé, traitement pharmacologique, chirurgie récente, implant métallique, prothèse, dispositif interne (ex. : pacemaker) ou toute autre condition pouvant interférer avec le fonctionnement normal des équipements.</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>4. Consentement Éclairé</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground space-y-4">
                                <p>Le Client déclare avoir reçu des informations complètes, claires et compréhensibles sur :</p>
                                <ul className="list-disc list-inside pl-4">
                                    <li>La nature des traitements et des équipements ;</li>
                                    <li>Les objectifs et limitations de chaque service ;</li>
                                    <li>Les contre-indications médicales et les précautions de sécurité ;</li>
                                    <li>Les risques potentiels, effets secondaires et réactions temporaires ;</li>
                                    <li>Les recommandations avant, pendant et après chaque séance.</li>
                                </ul>
                                <p>Le Client comprend et accepte que le consentement est donné librement, sans coercition, influence externe ou promesse de résultat, reconnaissant que ce document a une nature informative et préventive, et ne constitue pas un contrat médical.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>5. Risques, Effets Secondaires et Limitations</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground space-y-4">
                                <p>L'utilisation des services de M.E Experience peut comporter des risques minimes et contrôlés, que le Client accepte expressément, incluant, sans s'y limiter :</p>
                                <ul className="list-disc list-inside pl-4">
                                    <li>Érythème cutané (rougeur), échauffement local, sécheresse ou sensibilité de la peau ;</li>
                                    <li>Sudation intense, fatigue physique ou déshydratation (dans les traitements thermiques) ;</li>
                                    <li>Irritation oculaire, sensibilité à la lumière ou maux de tête (dans les traitements lumineux) ;</li>
                                    <li>Aggravation temporaire de conditions dermatologiques préexistantes ;</li>
                                    <li>Réactions idiosyncrasiques imprévisibles, inhérentes à la biologie individuelle.</li>
                                </ul>
                                <p>Le Client reconnaît que de tels effets, lorsqu'ils surviennent, sont généralement bénins, réversibles et ne constituent pas une défaillance du service, à condition que la procédure ait été exécutée conformément aux instructions et recommandations techniques.</p>
                                <p>M.E Beauty met tout en œuvre pour garantir la sécurité et l'efficacité de ses équipements, mais n'assume aucune garantie de résultat. Le Client doit comprendre que chaque organisme répond de manière distincte et imprévisible aux stimuli physiques et lumineux.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>6. Contre-indications Spécifiques par Service</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-lg text-foreground">6.1. Collagen Boost — Thérapie par Lumière Rouge (RLT)</h4>
                                    <p className="text-muted-foreground mt-2">Service de photobiomodulation cutanée non invasif. Utilisation interdite ou déconseillée en cas de :</p>
                                    <ul className="list-disc list-inside pl-4 mt-2 text-muted-foreground">
                                        <li>Grossesse ;</li>
                                        <li>Épilepsie photosensible ;</li>
                                        <li>Traitement avec des médicaments photosensibilisants ;</li>
                                        <li>Maladies dermatologiques actives, brûlures, infections cutanées ;</li>
                                        <li>Chirurgie ou peeling récent.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg text-foreground">6.2. Hydrojet — Massage par Hydrojet</h4>
                                    <p className="text-muted-foreground mt-2">Thérapie de pression d'eau sur une membrane flexible, à des fins relaxantes. Contre-indications : maladies cardiovasculaires graves, thrombose, varices avancées, diabète non contrôlé, grossesse au 1er trimestre, plaies ouvertes, épilepsie. Précautions : grossesse après le 1er trimestre (avec autorisation médicale), problèmes de dos, prothèses ou implants récents.</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg text-foreground">6.3. Dôme Infrarouge — Sauna à Infrarouges</h4>
                                    <p className="text-muted-foreground mt-2">Thérapie thermique par émission de rayonnement infrarouge à ondes longues. Risques et précautions :</p>
                                    <ul className="list-disc list-inside pl-4 mt-2 text-muted-foreground">
                                        <li>Nécessite une hydratation adéquate avant et après utilisation ;</li>
                                        <li>Ne pas dépasser 40 minutes de séance ;</li>
                                        <li>Déconseillé en cas de sclérose en plaques, grossesse (surtout 1er trimestre), fièvre, infections, maladies cardiovasculaires ou hypotension sévère ;</li>
                                        <li>Interrompre immédiatement en cas de vertiges, nausées ou malaise.</li>
                                    </ul>
                                </div>
                                 <Alert variant="destructive">
                                     <Ban className="h-4 w-4" />
                                     <AlertTitle>6.4. Solarium — Banc Solaire / Lit de Bronzage</AlertTitle>
                                     <AlertDescription>
                                        <p className="mb-2">L'exposition aux rayonnements ultraviolets (UV) artificiels comporte des risques avérés pour la santé de la peau et des yeux. Utilisation interdite pour :</p>
                                        <ul className="list-disc list-inside pl-4 space-y-1">
                                            <li>Les mineurs de moins de 18 ans ;</li>
                                            <li>Peau de type I (très claire, qui brûle toujours et ne bronze jamais) ;</li>
                                            <li>Personnes avec antécédents de cancer de la peau ou de multiples grains de beauté atypiques ;</li>
                                            <li>Femmes enceintes ;</li>
                                            <li>Utilisateurs de médicaments photosensibilisants ;</li>
                                            <li>Maladies dermatologiques aggravées par les UV (rosacée, psoriasis actif, lupus).</li>
                                        </ul>
                                        <p className="mt-2 font-semibold">Conditions de sécurité obligatoires :</p>
                                        <ul className="list-disc list-inside pl-4 space-y-1">
                                            <li>Durée maximale de 6 à 12 minutes par séance ;</li>
                                            <li>Intervalle minimum de 48 heures entre les utilisations ;</li>
                                            <li>Lunettes de protection obligatoires ;</li>
                                            <li>Éviter les cosmétiques, parfums ou crèmes avec de l'alcool avant l'exposition ;</li>
                                            <li>Hydrater la peau après chaque séance.</li>
                                        </ul>
                                         <p className="mt-2 font-bold">Le Client reconnaît que l'utilisation du Solarium est à ses risques et périls personnels, exonérant M.E Beauty de toute conséquence dermatologique, esthétique ou ophtalmologique.</p>
                                     </AlertDescription>
                                 </Alert>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>7. Exonération de Responsabilité</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground space-y-4">
                                <p>M.E Beauty, ses administrateurs, employés, partenaires et fournisseurs ne pourront, en aucun cas, être tenus responsables pour :</p>
                                <ul className="list-disc list-inside pl-4">
                                    <li>Blessures, brûlures, réactions cutanées, irritations ou inconforts découlant d'une utilisation inappropriée des équipements ;</li>
                                    <li>Aggravation de pathologies préexistantes non déclarées ;</li>
                                    <li>Dommages résultant du non-respect des consignes de sécurité ;</li>
                                    <li>Pannes techniques occasionnelles, interruptions temporaires ou événements de force majeure ;</li>
                                    <li>Attentes de résultats non atteintes.</li>
                                </ul>
                                <p>La responsabilité de M.E Beauty se limite au respect des normes de sécurité et de maintenance des équipements, ainsi qu'à l'observation de la diligence professionnelle requise pour la nature des services fournis.</p>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>8. Consentement Implicite et Validité Juridique</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>En effectuant une réservation, un paiement, en accédant à la plateforme ou en utilisant physiquement toute installation de M.E Experience, le Client reconnaît et déclare avoir lu et compris le présent document, en accepte intégralement le contenu et consent tacitement à l'exécution des services tels que décrits.</p>
                                <p className="mt-4">Ce consentement est considéré comme juridiquement valide aux termes du Règlement (UE) 910/2014 (eIDAS) sur les signatures électroniques et les transactions numériques, ayant une valeur équivalente au consentement écrit.</p>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>9. Mises à Jour et Révisions</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>M.E Beauty se réserve le droit de modifier, compléter ou mettre à jour le contenu de ces Termes de Responsabilité chaque fois que nécessaire, conformément aux modifications législatives, technologiques ou sanitaires. Les versions mises à jour seront publiées sur la Plateforme et considérées comme acceptées par la poursuite de l'utilisation des services.</p>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>10. Loi Applicable et Juridiction Compétente</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>Le présent document est régi par la législation du Grand-Duché de Luxembourg, notamment par le Code Civil Luxembourgeois et les autres normes de protection des consommateurs et de santé publique applicables. Pour la résolution de tout litige découlant de l'interprétation, de l'exécution ou de la validité du présent texte, le Tribunal d'arrondissement de Luxembourg-Ville est compétent, sans préjudice des dispositions légales impératives en matière de protection des consommateurs.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <footer className="pt-10 mt-10 border-t text-center text-sm text-muted-foreground">
                        <p className="font-bold">📄 M.E Beauty S.à r.l.</p>
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
