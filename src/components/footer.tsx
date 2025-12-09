
import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-secondary border-t" id="contact">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex flex-col items-start space-y-4">
            <Link href="/" className="flex items-center gap-2" prefetch={false}>
               <Image src="https://supabase.me-experience.lu/storage/v1/object/public/images/Logo/logoblack1.png" alt="M.E Experience Logo" width={60} height={15} />
            </Link>
            <p className="text-sm text-muted-foreground">
              Le meilleur du bien-être en toute intimité.
            </p>
            <p className="text-sm text-muted-foreground">
              20 Grand-Rue, 3650 Tétange, Luxembourg
            </p>
          </div>
          <div className="grid gap-1">
            <h3 className="font-semibold">Navigation</h3>
            <Link href="/" className="text-sm text-muted-foreground hover:underline" prefetch={false}>
              Accueil
            </Link>
            <Link href="/services" className="text-sm text-muted-foreground hover:underline" prefetch={false}>
              Services
            </Link>
            <Link href="/abonnements" className="text-sm text-muted-foreground hover:underline" prefetch={false}>
              Tarifs
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:underline" prefetch={false}>
              À Propos
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:underline" prefetch={false}>
              Contact
            </Link>
          </div>
          <div className="grid gap-1">
            <h3 className="font-semibold">Légal</h3>
            <Link href="/termos-de-condicao" className="text-sm text-muted-foreground hover:underline" prefetch={false}>
              Termes et Conditions
            </Link>
             <Link href="/termos-de-responsabilidade" className="text-sm text-muted-foreground hover:underline" prefetch={false}>
              Termes de Responsabilité
            </Link>
            <Link href="/politica-de-privacidade" className="text-sm text-muted-foreground hover:underline" prefetch={false}>
              Politique de confidentialité
            </Link>
             <Link href="/politica-de-reembolso" className="text-sm text-muted-foreground hover:underline" prefetch={false}>
              Politique de Remboursement
            </Link>
          </div>
          <div className="grid gap-1">
            <h3 className="font-semibold">Suivez-nous</h3>
            <div className="flex gap-4">
              <Link href="https://www.instagram.com/m.e_experience" target="_blank" aria-label="Instagram" prefetch={false}>
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary" />
              </Link>
              <Link href="https://www.facebook.com/people/ME-Experience/61559933177695/" target="_blank" aria-label="Facebook" prefetch={false}>
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 M.E Experience. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
