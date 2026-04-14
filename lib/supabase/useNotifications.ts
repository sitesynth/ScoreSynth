"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";

export function useNotifications(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) { setUnreadCount(0); return; }
    const supabase = createClient();

    const fetch = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    };

    fetch();

    // Realtime subscription
    const channel = supabase
      .channel("notifications:" + userId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return unreadCount;
}
