import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContactView } from "@/components/contact-view";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact & Accès | M.E Experience Luxembourg',
  description: 'Trouvez-nous facilement. Adresse, horaires d\'ouverture et formulaire de contact. Nous sommes à votre écoute.',
};

export default function ContactPage() {
    return (
        <>
            <Header />
            <ContactView />
            <Footer />
        </>
    );
}