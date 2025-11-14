
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Newsletter() {

    return (
        <section 
            className="w-full py-16 md:py-24 bg-secondary/30"
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Rejoignez notre univers</h2>
                        <p className="max-w-xl mx-auto text-muted-foreground">
                            Abonnez-vous à notre newsletter pour recevoir des offres exclusives, des conseils bien-être et les dernières actualités de M.E Experience.
                        </p>
                    </div>
                    <div className="w-full max-w-md">
                        <form className="flex space-x-2">
                            <Input
                                type="email"
                                placeholder="Entrez votre e-mail"
                                className="flex-1 px-4 py-2"
                                aria-label="Email for newsletter"
                            />
                            <Button type="submit">
                                S'abonner
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
