"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";

export function useAuth() {
  const [user, setUser]     = useState<User | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadHandle(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", userId)
        .maybeSingle();
      setHandle(data?.handle ?? null);
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        loadHandle(data.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadHandle(session.user.id).finally(() => setLoading(false));
      } else {
        setHandle(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, handle, loading };
}
