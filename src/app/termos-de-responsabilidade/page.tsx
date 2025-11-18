'use client';

import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Info, HeartPulse, Waves, Leaf, Wind, Ban, AlertTriangle, CheckCircle2, FileText, XCircle } from "lucide-react";

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
                                <CardTitle>1. Identification et Champ d'Application</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>Les présents <strong>Termes de Responsabilité</strong> régissent l'utilisation des services, équipements, et installations de M.E Experience. Ils sont la propriété de et exploités par la société <u>M.E Beauty S.à r.l.</u>, ayant son siège social au 20 Grand-Rue, L-3650 Tétange, Kayl, Luxembourg, immatriculée sous le numéro RCS B286312, avec l'EUID LURCSL.B286312 et le numéro d'identification fiscale TVA LU35923632 (ci-après le "Prestataire").</p>
                                <p>Ces Termes complètent et font partie intégrante des <Link href="/termos-de-condicao" className="underline hover:text-primary">Termes et Conditions d'Utilisation</Link>. L'accès, la navigation ou l'utilisation de la Plateforme implique <strong>l'acceptation pleine et entière</strong> de ces Termes par l'utilisateur ("Client" ou "Utilisateur").</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Objet et Finalité</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>Ce document a pour but de définir le cadre juridique de l'utilisation des services de bien-être non médicaux, en délimitant les responsabilités de chaque partie et en assurant que le Client utilise les services de manière libre et informée.</p>
                                <Alert>
                                  <Info className="h-4 w-4" />
                                  <AlertDescription>La lecture intégrale et attentive du présent texte est une condition préalable et essentielle à l'utilisation des services offerts, que ce soit en ligne ou en personne.</AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>3. Nature des Services et Exclusion d'Activité Médicale</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>M.E Experience est un centre de bien-être et d'esthétique non médicale. La nature des services fournis est strictement <strong>non clinique et non thérapeutique.</strong> Aucun service offert par M.E Beauty n'est destiné à :</p>
                                <ul className="list-disc list-inside pl-4 space-y-2">
                                    <li>Diagnostiquer, traiter, guérir ou prévenir des maladies ;</li>
                                    <li>Remplacer un avis médical, kinésithérapeutique ou dermatologique ;</li>
                                    <li>Produire des effets cliniques garantis ;</li>
                                    <li>Attribuer au Client des résultats esthétiques, métaboliques ou physiologiques déterminés.</li>
                                </ul>
                                <p>Le Client reconnaît expressément que tous les services prestados sont de nature complémentaire, voluntária e recreativa. O uso dos serviços é feito por conta e risco do Cliente, com base em consentimento informado e sob exclusiva responsabilidade pessoal.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>4. Devoir d'Autodéclaration et Responsabilité Personnelle</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground">
                                <p>Le Client, en s'inscrivant, en prenant rendez-vous ou en utilisant toute installation, déclare sur l'honneur que :</p>
                                <ul className="list-disc list-inside pl-4 space-y-2">
                                    <li>Il se trouve en bonnes conditions physiques et mentales ;</li>
                                    <li>Il ne présente pas de maladies cardiovasculaires, neurologiques, auto-immunes, d'infections, de plaies ouvertes, ou toute autre condition incompatible avec l'utilisation des équipements ;</li>
                                    <li>Il n'est pas enceinte ou, si c'est le cas, s'engage à obtenir un avis médical écrit avant toute utilisation ;</li>
                                    <li>Il n'utilise pas de médicaments photosensibilisants ou d'autres traitements pouvant interagir négativement avec les services ;</li>
                                    <li>Il n'est pas sous l'influence d'alcool ou de stupéfiants.</li>
                                </ul>
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Important</AlertTitle>
                                    <AlertDescription>L'omission ou la fausseté dans les informations fournies engage la responsabilité personnelle et directe du Client, excluant intégralement celle de M.E Beauty.</AlertDescription>
                                </Alert>
                                <p>Le Client s'engage également à communiquer toute modification de son état de santé avant chaque séance.</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>5. Consentement Éclairé</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground space-y-4">
                                <p>Le Client déclare avoir reçu des informations complètes sur la nature des traitements, leurs objectifs, limitations, contre-indications et risques potentiels. Le consentement est donné librement, sans coercition ni promesse de résultat.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>6. Risques, Effets Secondaires et Limitations</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground space-y-4">
                                <p>L'utilisation des services peut comporter des risques minimes, que le Client accepte, incluant : rougeur cutanée, sudation, fatigue, ou irritation. Le Client reconnaît que ces effets sont généralement bénins et ne constituent pas une défaillance du service. M.E Beauty ne garantit aucun résultat spécifique.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>7. Contre-indications Spécifiques par Service</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-lg text-foreground">7.1. Collagen Boost — Thérapie par Lumière Rouge (RLT)</h4>
                                    <p className="text-muted-foreground mt-2">Usage interdit ou déconseillé en cas de : grossesse, épilepsie photosensible, traitement avec des médicaments photosensibilisants, maladies dermatologiques actives. Le port de lunettes de protection est obligatoire.</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg text-foreground">7.2. Hydrojet — Massage par Hydrojet</h4>
                                    <p className="text-muted-foreground mt-2">Contre-indications : maladies cardiovasculaires graves, thrombose, grossesse au 1er trimestre. Précautions pour les problèmes de dos ou implants récents.</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg text-foreground">7.3. Dôme Infrarouge — Sauna à Infrarouges</h4>
                                    <p className="text-muted-foreground mt-2">Nécessite une hydratation adéquate. Déconseillé en cas de sclérose en plaques, grossesse, fièvre, ou maladies cardiovasculaires. Interrompre en cas de malaise.</p>
                                </div>
                                 <Alert variant="destructive">
                                     <Ban className="h-4 w-4" />
                                     <AlertTitle>7.4. Solarium — Banc Solaire / Lit de Bronzage</AlertTitle>
                                     <AlertDescription>
                                        <p className="mb-2">L'exposition aux UV artificiels comporte des risques. Usage interdit pour les mineurs, les peaux de type I, les personnes avec antécédents de cancer de la peau, les femmes enceintes et les utilisateurs de médicaments photosensibilisants.</p>
                                        <p className="mt-2 font-semibold">Conditions de sécurité obligatoires :</p>
                                        <ul className="list-disc list-inside pl-4 space-y-1">
                                            <li>Durée maximale de 6 à 12 minutes ;</li>
                                            <li>Intervalle de 48h entre les séances ;</li>
                                            <li>Lunettes de protection obligatoires.</li>
                                        </ul>
                                         <p className="mt-2 font-bold">Le Client reconnaît que l'utilisation du Solarium est à ses risques et périls, exonérant M.E Beauty de toute conséquence.</p>
                                     </AlertDescription>
                                 </Alert>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>8. Exonération de Responsabilité</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground space-y-4">
                                <p>M.E Beauty ne pourra être tenue responsable pour des blessures ou réactions découlant d'une utilisation inappropriée, de la non-déclaration de conditions préexistantes, ou du non-respect des consignes de sécurité. La responsabilité de M.E Beauty se limite à la maintenance et à la sécurité des équipements.</p>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>9. Consentement Implicite et Validité Juridique</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>En effectuant une réservation ou en utilisant les installations, le Client reconnaît avoir lu, compris et accepté le présent document. Ce consentement est considéré comme juridiquement valide.</p>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>10. Mises à Jour et Révisions</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>M.E Beauty se réserve le droit de modifier ces Termes. Les versions mises à jour seront publiées sur la Plateforme et considérées comme acceptées par la poursuite de l'utilisation des services.</p>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>11. Loi Applicable et Juridiction Compétente</CardTitle></CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>Le présent document est régi par la législation du Grand-Duché de Luxembourg. Tout litige sera soumis à la juridiction exclusive des Tribunaux du district de Luxembourg-Ville.</p>
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
