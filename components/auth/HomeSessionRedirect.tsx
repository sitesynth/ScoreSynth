"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";

export default function HomeSessionRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, handle, loading } = useAuth();

  useEffect(() => {
    if (pathname !== "/" || loading || !user) return;
    let cancelled = false;
    const supabase = createClient();

    // Client-authoritative routing fallback when server middleware cannot see auth cookies.
    supabase
      .from("profiles")
      .select("handle, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          if (handle) router.replace(`/community/user/${handle}`);
          else router.replace("/onboarding");
          return;
        }

        if (data?.onboarding_completed && data?.handle) {
          router.replace(`/community/user/${data.handle}`);
        } else {
          router.replace("/onboarding");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, loading, user?.id, handle, router]);

  return null;
}
