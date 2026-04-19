"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomeSessionGuard() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      router.replace("/auth/continue");
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
