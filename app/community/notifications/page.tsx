"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/useAuth";
import { useNotifications } from "@/lib/supabase/useNotifications";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function typeIcon(type: string) {
  switch (type) {
    case "welcome": return (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    );
    case "like": return (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    );
    case "comment": return (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    );
    case "follow": return (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    );
    default: return (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    );
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { items, unreadCount, markAllRead, markRead } = useNotifications(user?.id ?? null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/community");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1a1110",
      paddingTop: "96px",
      paddingBottom: "60px",
    }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "28px",
        }}>
          <div>
            <h1 style={{
              fontFamily: "Georgia, serif", fontSize: "28px",
              color: "#fff", fontWeight: 400, margin: 0,
            }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p style={{ fontSize: "13px", color: "#a89690", margin: "4px 0 0" }}>
                {unreadCount} unread
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: "12px", color: "#a89690",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", padding: "7px 14px",
                  cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            )}
            <Link
              href="/community"
              style={{
                fontSize: "12px", color: "#6b5452",
                textDecoration: "none",
              }}
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* List */}
        {items.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 0",
            color: "#6b5452", fontSize: "14px",
          }}>
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: "16px", opacity: 0.4 }}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <p style={{ margin: 0 }}>No notifications yet</p>
          </div>
        ) : (
          <div style={{
            background: "#2a1f1e",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            overflow: "hidden",
          }}>
            {items.map((n, i) => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                style={{
                  display: "flex", gap: "14px", alignItems: "flex-start",
                  padding: "18px 20px",
                  borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  background: n.read ? "transparent" : "rgba(192,57,43,0.06)",
                  cursor: n.read ? "default" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {/* Icon */}
                <div style={{
                  flexShrink: 0, marginTop: "2px",
                  width: "36px", height: "36px",
                  borderRadius: "10px",
                  background: n.read ? "rgba(255,255,255,0.04)" : "rgba(192,57,43,0.15)",
                  color: n.read ? "#4a3432" : "#c0392b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {typeIcon(n.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex", alignItems: "baseline",
                    justifyContent: "space-between", gap: "12px",
                    marginBottom: "4px",
                  }}>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: n.read ? 500 : 700,
                      color: n.read ? "#e8dbd8" : "#fff",
                    }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: "11px", color: "#4a3432", flexShrink: 0 }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {(n.type === "welcome" || n.type === "message") && (
                    <div style={{ fontSize: "11px", color: "#c0392b", fontWeight: 500, marginBottom: "6px" }}>
                      @mayyascoresynth
                    </div>
                  )}
                  <p style={{
                    fontSize: "12px", color: "#8a7370",
                    lineHeight: 1.65, margin: 0,
                    whiteSpace: "pre-line",
                  }}>
                    {n.body}
                  </p>
                </div>

                {/* Unread indicator */}
                {!n.read && (
                  <div style={{
                    flexShrink: 0, marginTop: "8px",
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#c0392b",
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
