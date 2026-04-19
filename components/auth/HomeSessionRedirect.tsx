"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/useAuth";

export default function HomeSessionRedirect() {
  const router = useRouter();
  const { user, handle, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (handle) {
      router.replace(`/community/user/${handle}`);
    } else {
      router.replace("/onboarding");
    }
  }, [loading, user, handle, router]);

  return null;
}
