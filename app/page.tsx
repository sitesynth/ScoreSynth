import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import CommunitySection from "@/components/home/CommunitySection";
import HowItWorks from "@/components/home/HowItWorks";
import Pricing from "@/components/home/Pricing";
import APISection from "@/components/home/APISection";
import FAQ from "@/components/home/FAQ";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.handle) {
      redirect(`/community/user/${profile.handle}`);
    } else {
      redirect("/onboarding?force=1");
    }
  }

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
