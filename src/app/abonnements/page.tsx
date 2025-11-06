
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Pricing } from "@/components/pricing";

export default function AbonnementsPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-185px)] flex-col">
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
