'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Home, Phone, Mail } from "lucide-react";
import Image from "next/image";

export function ContactView() {
    return (
        <main className="flex-grow bg-background">
            <section className="relative w-full h-[50vh] bg-black text-white">
                <Image
                    src="https://supabase.me-experience.lu/storage/v1/object/public/images/All/Contactos.png"
                    alt="Contactez-nous"
                    layout="fill"
                    objectFit="cover"
                    className="opacity-40"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-6xl">Contactez-nous</h1>
                    <p className="max-w-2xl mx-auto mt-4 text-white/90 md:text-xl">
                        Nous sommes là pour répondre à toutes vos questions.
                    </p>
                </div>
            </section>

            <section className="w-full py-12 md:py-20">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Envoyez-nous un message</CardTitle>
                                <CardDescription>Remplissez le formulaire et nous vous répondrons dès que possible.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <Input placeholder="Votre nom" />
                                        <Input type="email" placeholder="Votre e-mail" />
                                    </div>
                                    <Input placeholder="Sujet" />
                                    <Textarea placeholder="Votre message" rows={5} />
                                    <Button type="submit" className="w-full">Envoyer</Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Contact Info & Hours */}
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline">Nos Coordonnées</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <Home className="h-6 w-6 text-primary mt-1" />
                                        <div>
                                            <h4 className="font-semibold font-headline">Adresse</h4>
                                            <p className="text-muted-foreground">20 Grand-Rue, 3650 Tétange, Luxembourg</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Phone className="h-6 w-6 text-primary mt-1" />
                                        <div>
                                            <h4 className="font-semibold font-headline">Téléphone</h4>
                                            <p className="text-muted-foreground">+352 691 389 519</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Mail className="h-6 w-6 text-primary mt-1" />
                                        <div>
                                            <h4 className="font-semibold font-headline">E-mail</h4>
                                            <p className="text-muted-foreground">contact@me-experience.lu</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline">Horaires d'Ouverture</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-muted-foreground">
                                    <div className="flex justify-between"><span>Lundi - Vendredi</span><span>09:00 – 20:00</span></div>
                                    <div className="flex justify-between"><span>Samedi</span><span>09:00 – 19:00</span></div>
                                    <div className="flex justify-between"><span>Dimanche</span><span>11:00 – 15:00</span></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Map Section */}
            <section className="w-full h-[50vh]">
                    <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2595.340842034444!2d6.035973876939943!3d49.46280005918128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47957f594b290967%3A0x1d5c483f62153393!2s20%20Grand-Rue%2C%203650%20Kayl%2C%20Luxembourg!5e0!3m2!1sen!2sus!4v1719503460431!5m2!1sen!2sus"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location of M.E Experience"
                ></iframe>
            </section>
        </main>
    );
}