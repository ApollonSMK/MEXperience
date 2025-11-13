
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Newsletter() {

    return (
        <section 
            className="relative w-full py-16 md:py-24 text-white overflow-hidden pb-24 md:pb-32"
        >
            <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover -z-10"
              >
                <source src="https://supabase.me-experience.lu/storage/v1/object/public/images/Videos/back2.mp4" type="video/mp4" />
                Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
            <div className="absolute inset-0 bg-black/60" />
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Rejoignez notre univers</h2>
                        <p className="max-w-xl mx-auto text-white/80">
                            Abonnez-vous à notre newsletter pour recevoir des offres exclusives, des conseils bien-être et les dernières actualités de M.E Experience.
                        </p>
                    </div>
                    <div className="w-full max-w-md">
                        <form className="flex space-x-2">
                            <Input
                                type="email"
                                placeholder="Entrez votre e-mail"
                                className="flex-1 px-4 py-2 text-black"
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
