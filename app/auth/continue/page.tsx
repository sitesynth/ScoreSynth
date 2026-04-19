"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function isRecentUser(createdAt?: string) {
  const ts = createdAt ? Date.parse(createdAt) : Number.NaN;
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < 24 * 60 * 60 * 1000; // 24h
}

export default function AuthContinuePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        router.replace("/");
        return;
      }

      const metadata = (user.user_metadata ?? {}) as { onboarding_completed?: boolean };
      const profile = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      const handle = profile.error ? null : profile.data?.handle ?? null;
      const recent = isRecentUser((user as { created_at?: string }).created_at);
      const onboardingCompleted = metadata.onboarding_completed === true
        || (metadata.onboarding_completed !== false && !!handle && !recent);
      if (onboardingCompleted && handle) router.replace(`/community/user/${handle}`);
      else router.replace("/onboarding");
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#211817",
      color: "#e8dbd8",
      padding: "24px",
    }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "10px" }}>
        <p style={{ fontSize: "18px", margin: 0 }}>Signing you in…</p>
        <p style={{ fontSize: "13px", color: "#a89690", margin: 0 }}>Please wait a moment.</p>
      </div>
    </main>
  );
}
