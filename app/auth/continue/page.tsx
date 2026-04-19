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

      const withFlag = await supabase
        .from("profiles")
        .select("handle, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled && !withFlag.error) {
        const p = withFlag.data;
        if (p?.onboarding_completed && p?.handle) {
          router.replace(`/community/user/${p.handle}`);
        } else {
          router.replace("/onboarding");
        }
        return;
      }

      const fallback = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      const recent = isRecentUser((user as { created_at?: string }).created_at);
      if (fallback.data?.handle && !recent) router.replace(`/community/user/${fallback.data.handle}`);
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
