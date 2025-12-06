import GiftCardPurchaseView from '@/components/gift-card-purchase-view';
import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Cartes Cadeaux | Offrez du Bien-être',
  description: 'Achetez une carte cadeau en ligne valable sur tous nos soins et produits.',
};

export default function GiftCardPage() {
  return (
    <>
      <Header />
      <main className="bg-muted/30">
        <GiftCardPurchaseView />
      </main>
      <Footer />
    </>
  );
}