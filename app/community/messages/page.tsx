"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Participant = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
};

type ConvRow = {
  id: string;
  other: Participant;
  last_body: string | null;
  updated_at: string;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function Avatar({ user, size = 40 }: { user: Participant; size?: number }) {
  const letter = (user.display_name || user.handle)[0]?.toUpperCase() ?? "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#c0392b", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 600, color: "#fff",
      overflow: "hidden",
    }}>
      {user.avatar_url
        ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : letter}
    </div>
  );
}

function MessagesInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const withHandle = searchParams.get("with");

  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeOther, setActiveOther] = useState<Participant | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // New message compose
  const [showCompose, setShowCompose] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/community");
  }, [authLoading, user, router]);

  // User search for compose
  useEffect(() => {
    if (!search.trim() || !user) { setSearchResults([]); return; }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      const supabase = supabaseRef.current;
      const { data } = await supabase
        .from("profiles")
        .select("id, handle, display_name, avatar_url")
        .neq("id", user.id)
        .or(`handle.ilike.%${search}%,display_name.ilike.%${search}%`)
        .limit(6);
      setSearchResults((data as Participant[]) ?? []);
      setSearching(false);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search, user]);

  useEffect(() => {
    if (user) loadConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
    };
  }, []);

  async function loadConversations() {
    if (!user) return;
    const supabase = supabaseRef.current;

    const { data: convData } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2, updated_at")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (!convData) { setLoadingConvs(false); return; }

    // Collect other participants' IDs
    const otherIds = convData.map(c =>
      c.participant_1 === user.id ? c.participant_2 : c.participant_1
    );

    const [profilesRes, msgsRes] = await Promise.all([
      otherIds.length > 0
        ? supabase.from("profiles").select("id, handle, display_name, avatar_url").in("id", otherIds)
        : Promise.resolve({ data: [] }),
      convData.length > 0
        ? supabase.from("messages")
            .select("conversation_id, content, created_at")
            .in("conversation_id", convData.map(c => c.id))
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map(
      ((profilesRes.data ?? []) as Participant[]).map(p => [p.id, p])
    );

    // Last message per conversation
    const lastBodyMap = new Map<string, string>();
    for (const msg of (msgsRes.data ?? []) as { conversation_id: string; content: string }[]) {
      if (!lastBodyMap.has(msg.conversation_id)) lastBodyMap.set(msg.conversation_id, msg.content);
    }

    const rows: ConvRow[] = convData.map(c => {
      const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
      const profile = profileMap.get(otherId) ?? { id: otherId, handle: "unknown", display_name: null, avatar_url: null };
      return { id: c.id, other: profile, last_body: lastBodyMap.get(c.id) ?? null, updated_at: c.updated_at };
    });

    setConvs(rows);
    setLoadingConvs(false);

    // Handle ?with=<handle> — open or create conversation
    if (withHandle) {
      const profiles = (profilesRes.data ?? []) as Participant[];
      const targetInExisting = profiles.find(p => p.handle === withHandle);

      if (targetInExisting) {
        const existingConv = rows.find(r => r.other.id === targetInExisting.id);
        if (existingConv) {
          selectConv(existingConv);
          return;
        }
      }

      // Fetch profile if not already loaded
      const targetProfile = targetInExisting ?? await (async () => {
        const { data } = await supabase
          .from("profiles")
          .select("id, handle, display_name, avatar_url")
          .eq("handle", withHandle)
          .single();
        return data as Participant | null;
      })();

      if (targetProfile && targetProfile.id !== user.id) {
        await openOrCreateConv(targetProfile, rows);
      }
    }
  }

  async function openOrCreateConv(other: Participant, currentConvs?: ConvRow[]) {
    if (!user) return;
    const supabase = supabaseRef.current;
    const list = currentConvs ?? convs;

    const existing = list.find(r => r.other.id === other.id);
    if (existing) { selectConv(existing); return; }

    // Sort IDs to keep unique constraint consistent
    const [p1, p2] = [user.id, other.id].sort();

    // Upsert conversation
    const { data: conv } = await supabase
      .from("conversations")
      .upsert({ participant_1: p1, participant_2: p2 }, { onConflict: "participant_1,participant_2" })
      .select("id, participant_1, participant_2, updated_at")
      .single();

    if (!conv) return;

    const newRow: ConvRow = { id: conv.id, other, last_body: null, updated_at: conv.updated_at };
    setConvs(prev => prev.find(r => r.id === conv.id) ? prev : [newRow, ...prev]);
    selectConv(newRow);
  }

  function selectConv(conv: ConvRow) {
    setActiveConvId(conv.id);
    setActiveOther(conv.other);
    loadMessages(conv.id);
    subscribeToConv(conv.id);
  }

  async function loadMessages(convId: string) {
    setLoadingMsgs(true);
    const supabase = supabaseRef.current;
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
    setLoadingMsgs(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior }), 30);
  }

  function subscribeToConv(convId: string) {
    const supabase = supabaseRef.current;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
      .channel(`msgs-${convId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        payload => {
          const msg = payload.new as Message;
          setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
          // Update last_body in sidebar
          setConvs(prev => prev.map(c =>
            c.id === convId ? { ...c, last_body: msg.content, updated_at: msg.created_at } : c
          ));
        }
      )
      .subscribe();
  }

  async function sendMessage() {
    if (!draft.trim() || !activeConvId || !user || sending) return;
    const content = draft.trim();
    setDraft("");
    setSending(true);

    const supabase = supabaseRef.current;
    const now = new Date().toISOString();

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = { id: tempId, sender_id: user.id, content, created_at: now };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: activeConvId, sender_id: user.id, content })
      .select("id, sender_id, content, created_at")
      .single();

    if (error) {
      console.error("Message send error:", error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? (data as Message) : m));
      await supabase.from("conversations").update({ updated_at: now }).eq("id", activeConvId);
      setConvs(prev => prev.map(c =>
        c.id === activeConvId ? { ...c, last_body: content, updated_at: now } : c
      ));
    }

    setSending(false);
  }

  if (authLoading || !user) return null;

  return (
    <>
      <Navbar />
      <main style={{
        paddingTop: "64px", background: "#211817",
        height: "100vh", display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{
          flex: 1, display: "flex", overflow: "hidden",
          maxWidth: "1100px", width: "100%", margin: "0 auto",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* ── Left sidebar ── */}
          <div style={{
            width: "280px", flexShrink: 0,
            borderRight: "1px solid rgba(255,255,255,0.07)",
            display: "flex", flexDirection: "column",
            overflowY: "auto",
          }}>
            <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showCompose ? "12px" : 0 }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "18px", color: "#fff", fontWeight: 400 }}>
                  Messages
                </h2>
                <button
                  onClick={() => { setShowCompose(v => !v); setSearch(""); setSearchResults([]); }}
                  title="New message"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "30px", height: "30px", borderRadius: "8px",
                    background: showCompose ? "rgba(255,255,255,0.1)" : "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#a89690", cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = showCompose ? "rgba(255,255,255,0.1)" : "transparent"; e.currentTarget.style.color = "#a89690"; }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              {/* Compose: search for a user */}
              {showCompose && (
                <div style={{ position: "relative" }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search by name or handle…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: "8px",
                      background: "#1e1513", border: "1px solid rgba(255,255,255,0.12)",
                      color: "#fff", fontSize: "12px", outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {(searchResults.length > 0 || searching) && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                      background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px", overflow: "hidden",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 50,
                    }}>
                      {searching && !searchResults.length ? (
                        <div style={{ padding: "12px 14px", fontSize: "12px", color: "#6b5452" }}>Searching…</div>
                      ) : (
                        searchResults.map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setShowCompose(false);
                              setSearch("");
                              setSearchResults([]);
                              openOrCreateConv(p);
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              width: "100%", padding: "10px 14px",
                              background: "none", border: "none",
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                              cursor: "pointer", textAlign: "left",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                          >
                            <Avatar user={p} size={30} />
                            <div>
                              <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8" }}>
                                {p.display_name || p.handle}
                              </p>
                              <p style={{ fontSize: "11px", color: "#6b5452" }}>@{p.handle}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {loadingConvs ? (
              <p style={{ padding: "20px", fontSize: "13px", color: "#6b5452" }}>Loading…</p>
            ) : convs.length === 0 ? (
              <div style={{ padding: "24px 20px" }}>
                <p style={{ fontSize: "13px", color: "#6b5452", lineHeight: 1.6 }}>
                  No conversations yet. Visit someone&apos;s profile and click <b style={{ color: "#a89690" }}>Message</b> to start chatting.
                </p>
              </div>
            ) : (
              convs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => selectConv(conv)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "14px 16px", width: "100%", textAlign: "left",
                    background: activeConvId === conv.id ? "rgba(255,255,255,0.06)" : "none",
                    border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer", transition: "background 0.15s", flexShrink: 0,
                  }}
                >
                  <Avatar user={conv.other} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", marginBottom: "3px" }}>
                      {conv.other.display_name || conv.other.handle}
                    </p>
                    {conv.last_body && (
                      <p style={{ fontSize: "12px", color: "#6b5452", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {conv.last_body}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* ── Right chat pane ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {!activeConvId ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <svg width="52" height="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: "14px" }}>
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  <p style={{ fontSize: "14px", color: "#6b5452" }}>Select a conversation</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{
                  padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", gap: "12px", flexShrink: 0,
                }}>
                  {activeOther && (
                    <>
                      <Avatar user={activeOther} size={36} />
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8" }}>
                          {activeOther.display_name || activeOther.handle}
                        </p>
                        <a
                          href={`/community/user/${activeOther.handle}`}
                          style={{ fontSize: "12px", color: "#6b5452", textDecoration: "none" }}
                        >
                          @{activeOther.handle}
                        </a>
                      </div>
                    </>
                  )}
                </div>

                {/* Messages list */}
                <div style={{
                  flex: 1, overflowY: "auto", padding: "20px 24px",
                  display: "flex", flexDirection: "column", gap: "8px",
                }}>
                  {loadingMsgs ? (
                    <p style={{ fontSize: "13px", color: "#6b5452", textAlign: "center", marginTop: "40px" }}>Loading…</p>
                  ) : messages.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#6b5452", textAlign: "center", marginTop: "40px" }}>
                      No messages yet. Say hi!
                    </p>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                          <div style={{
                            maxWidth: "68%", padding: "9px 14px",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: isMe ? "#c0392b" : "#2a1f1e",
                            border: isMe ? "none" : "1px solid rgba(255,255,255,0.09)",
                            fontSize: "13px", color: "#fff", lineHeight: 1.55,
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

                {/* Input bar */}
                <div style={{
                  padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", gap: "10px", flexShrink: 0,
                }}>
                  <input
                    type="text"
                    placeholder="Type a message…"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    style={{
                      flex: 1, padding: "10px 14px", borderRadius: "10px",
                      background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff", fontSize: "13px", outline: "none",
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!draft.trim() || sending}
                    style={{
                      padding: "10px 20px", borderRadius: "10px",
                      background: draft.trim() ? "#c0392b" : "rgba(192,57,43,0.25)",
                      border: "none", color: "#fff", fontSize: "13px", fontWeight: 500,
                      cursor: draft.trim() ? "pointer" : "default",
                      transition: "background 0.15s", flexShrink: 0,
                    }}
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  );
}
