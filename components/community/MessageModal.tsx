"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Participant = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function MessageModal({
  currentUserId,
  recipient,
  onClose,
}: {
  currentUserId: string;
  recipient: Participant;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [convId, setConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = useRef(createClient()).current;
  const inputRef = useRef<HTMLInputElement>(null);

  // Open or create conversation on mount
  useEffect(() => {
    async function init() {
      const [p1, p2] = [currentUserId, recipient.id].sort();
      const { data: conv } = await supabase
        .from("conversations")
        .upsert({ participant_1: p1, participant_2: p2 }, { onConflict: "participant_1,participant_2" })
        .select("id")
        .single();
      if (!conv) { setLoading(false); return; }
      setConvId(conv.id);

      // Load history
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });
      setMessages((msgs as Message[]) ?? []);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior }), 30);

      // Subscribe to realtime
      channelRef.current = supabase
        .channel(`modal-msgs-${conv.id}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "messages",
          filter: `conversation_id=eq.${conv.id}`,
        }, payload => {
          const msg = payload.new as Message;
          setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
        })
        .subscribe();
    }
    init();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus input when ready
  useEffect(() => {
    if (!loading) setTimeout(() => inputRef.current?.focus(), 50);
  }, [loading]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  async function send() {
    if (!draft.trim() || !convId || sending) return;
    const content = draft.trim();
    setDraft("");
    setSending(true);
    const now = new Date().toISOString();

    // Optimistic update — show immediately
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = { id: tempId, sender_id: currentUserId, content, created_at: now };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: convId, sender_id: currentUserId, content })
      .select("id, sender_id, content, created_at")
      .single();

    if (error) {
      console.error("Message send error:", error);
      // Remove temp message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else if (data) {
      // Replace temp with real row
      setMessages(prev => prev.map(m => m.id === tempId ? (data as Message) : m));
      await supabase.from("conversations").update({ updated_at: now }).eq("id", convId);
    }

    setSending(false);
  }

  const letter = (recipient.display_name || recipient.handle)[0]?.toUpperCase() ?? "?";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", bottom: "24px", right: "32px", zIndex: 101,
        width: "380px", height: "520px",
        background: "#211817",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "#c0392b", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: 600, color: "#fff", overflow: "hidden",
          }}>
            {recipient.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={recipient.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : letter}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#fff", marginBottom: "1px" }}>
              {recipient.display_name || recipient.handle}
            </p>
            <p style={{ fontSize: "11px", color: "#6b5452" }}>@{recipient.handle}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "#6b5452",
              cursor: "pointer", padding: "4px", borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "#6b5452"}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "16px",
          display: "flex", flexDirection: "column", gap: "7px",
        }}>
          {loading ? (
            <p style={{ textAlign: "center", fontSize: "12px", color: "#6b5452", marginTop: "40px" }}>Loading…</p>
          ) : messages.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: "12px", color: "#6b5452", marginTop: "40px" }}>
              No messages yet. Say hi!
            </p>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "75%", padding: "8px 12px",
                    borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isMe ? "#c0392b" : "#2a1f1e",
                    border: isMe ? "none" : "1px solid rgba(255,255,255,0.09)",
                    fontSize: "13px", color: "#fff", lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "12px 14px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex", gap: "8px", flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            style={{
              flex: 1, padding: "9px 12px", borderRadius: "9px",
              background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", fontSize: "13px", outline: "none",
            }}
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            style={{
              padding: "9px 16px", borderRadius: "9px",
              background: draft.trim() ? "#c0392b" : "rgba(192,57,43,0.25)",
              border: "none", color: "#fff", fontSize: "13px", fontWeight: 500,
              cursor: draft.trim() ? "pointer" : "default",
              transition: "background 0.15s", flexShrink: 0,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
