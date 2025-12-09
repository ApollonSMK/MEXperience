
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Pricing } from "@/components/pricing";
import { Services } from "@/components/services";
import { WhyChooseUs } from "@/components/why-choose-us";
import { CtaSection } from "@/components/cta-section";
import { Newsletter } from "@/components/newsletter";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Pricing />
        <CtaSection />
        <WhyChooseUs />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
