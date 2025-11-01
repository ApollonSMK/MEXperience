import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Pricing } from "@/components/pricing";
import { Services } from "@/components/services";
import { WhyChooseUs } from "@/components/why-choose-us";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <WhyChooseUs />
        <Pricing />
      </main>
    </>
  );
}