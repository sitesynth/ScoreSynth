import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import CommunitySection from "@/components/home/CommunitySection";
import HowItWorks from "@/components/home/HowItWorks";
import Pricing from "@/components/home/Pricing";
import APISection from "@/components/home/APISection";
import FAQ from "@/components/home/FAQ";
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CommunitySection />
        <HowItWorks />
        <Pricing />
        <APISection />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
