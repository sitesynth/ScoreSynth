import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import CommunitySection from "@/components/home/CommunitySection";
import HowItWorks from "@/components/home/HowItWorks";
import Pricing from "@/components/home/Pricing";
import APISection from "@/components/home/APISection";
import FAQ from "@/components/home/FAQ";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import HomeSessionGuard from "@/components/auth/HomeSessionGuard";

function isRecentUser(createdAt?: string) {
  const ts = createdAt ? Date.parse(createdAt) : Number.NaN;
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < 24 * 60 * 60 * 1000;
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .maybeSingle();

    const meta = user.user_metadata as { onboarding_completed?: boolean } | undefined;
    const onboardingCompleted = meta?.onboarding_completed === true
      || (meta?.onboarding_completed !== false
        && !!profile?.handle
        && !isRecentUser((user as { created_at?: string }).created_at));

    if (onboardingCompleted && profile?.handle) {
      redirect(`/community/user/${profile.handle}`);
    }
    redirect("/onboarding");
  }

  return (
    <>
      <HomeSessionGuard />
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
