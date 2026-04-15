"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "./client";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  score_id: string | null;
  actor_handle: string | null;
};

export function useNotifications(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const fetchAll = useCallback(async () => {
    if (!userId) { setUnreadCount(0); setItems([]); return; }
    const supabase = createClient();

    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at, score_id, actor_handle")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const list = (data ?? []) as NotificationItem[];
    setItems(list);
    setUnreadCount(list.filter(n => !n.read).length);
  }, [userId]);

  useEffect(() => {
    if (!userId) { setUnreadCount(0); setItems([]); return; }
    const supabase = createClient();

    fetchAll();

    const channel = supabase
      .channel("notifications:" + userId)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchAll]);

  const markRead = useCallback(async (id: string) => {
    if (!userId) return;
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", userId);
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { unreadCount, items, markRead, markAllRead };
}
