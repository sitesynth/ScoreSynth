"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/useAuth";
import { useNotifications, NotificationItem } from "@/lib/supabase/useNotifications";
import AuthModal from "@/components/community/AuthModal";
import AccountSettingsModal from "@/components/community/AccountSettingsModal";
import SupportModal from "@/components/app/SupportModal";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "API", href: "/#api" },
  { label: "FAQ", href: "/#faq" },
  { label: "Music Scores", href: "/community" },
];

function notifHref(n: NotificationItem): string {
  switch (n.type) {
    case "welcome":
      return "/community/messages?with=mayyascoresynth";
    case "message":
      return n.actor_handle
        ? `/community/messages?with=${n.actor_handle}`
        : "/community/messages";
    case "like":
    case "comment":
      return n.score_id
        ? `/community/${n.score_id}`
        : "/community/notifications";
    case "follow":
      return n.actor_handle
        ? `/community/user/${n.actor_handle}`
        : "/community/notifications";
    default:
      return "/community/notifications";
  }
}

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

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserDrop, setShowUserDrop] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const router = useRouter();
  const { user, handle, loading } = useAuth();
  const { unreadCount, items, markRead, markAllRead } = useNotifications(user?.id ?? null);
  const notifsRef = useRef<HTMLDivElement>(null);
  const userDropRef = useRef<HTMLDivElement>(null);

  // Fetch avatar + display name when logged in
  useEffect(() => {
    if (!user) { setAvatarUrl(null); setDisplayName(""); return; }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || "");
          setAvatarUrl(data.avatar_url || null);
        }
      });
  }, [user?.id]);

  // Close notifs dropdown on outside click
  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifs]);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!showUserDrop) return;
    const handler = (e: MouseEvent) => {
      if (userDropRef.current && !userDropRef.current.contains(e.target as Node)) {
        setShowUserDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserDrop]);

  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.[0] ?? "U").toUpperCase();

  const previewItems = items.slice(0, 5);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        height: "64px",
        background: "rgba(33,24,23,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }} className="nav-bar">
        {/* Inner container aligned to content grid */}
        <div style={{
          maxWidth: "1100px", margin: "0 auto", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}>
            <Image src="/logos/logo-scoresynth.svg" alt="ScoreSynth" width={140} height={32} priority />
          </Link>

          {/* Desktop nav links + CTA grouped on the right */}
          <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "28px", marginLeft: "auto" }}>
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                style={{ fontSize: "13px", color: "#a89690", transition: "color 0.15s", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#a89690")}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0, marginLeft: "32px" }}>
            <Link
              href="/contact"
              style={{
                fontSize: "13px", fontWeight: 500,
                padding: "8px 16px", borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.24)",
                color: "#e8dbd8", textDecoration: "none",
                transition: "background-color 0.15s, border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.42)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.24)";
                e.currentTarget.style.color = "#e8dbd8";
              }}
            >
              Contact us
            </Link>
            {!loading && (
              user ? (
                <>
                  {/* Avatar + user dropdown */}
                  <div ref={userDropRef} style={{ position: "relative", flexShrink: 0 }}>
                    <button
                      onClick={() => { setShowUserDrop(v => !v); setShowNotifs(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "7px",
                        background: showUserDrop ? "rgba(255,255,255,0.07)" : "transparent",
                        border: "1px solid rgba(255,255,255,0.24)",
                        borderRadius: "8px", padding: "4px 8px 4px 4px",
                        cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.42)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = showUserDrop ? "rgba(255,255,255,0.07)" : "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.24)"; }}
                    >
                      <div style={{
                        width: "26px", height: "26px", borderRadius: "50%", background: "#c0392b",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: 600, color: "#fff", flexShrink: 0, overflow: "hidden",
                      }}>
                        {avatarUrl
                          ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : initials}
                      </div>
                      <svg width="11" height="11" fill="none" stroke="#a89690" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>

                    {showUserDrop && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        width: "220px", zIndex: 200,
                        background: "#1e1412",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
                      }}>
                        {/* Identity */}
                        <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "36px", height: "36px", borderRadius: "50%", background: "#c0392b",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "14px", fontWeight: 600, color: "#fff", flexShrink: 0, overflow: "hidden",
                          }}>
                            {avatarUrl
                              ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {displayName || handle || ""}
                            </p>
                            <p style={{ fontSize: "11px", color: "#6b5452", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {handle ? `@${handle}` : user?.email}
                            </p>
                          </div>
                        </div>

                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "5px" }}>
                          <button
                            onClick={() => { router.push(handle ? `/community/user/${handle}` : "/community"); setShowUserDrop(false); }}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "#e8dbd8", fontSize: "13px", width: "100%", textAlign: "left", transition: "background 0.13s" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                            View my profile
                          </button>
                          <button
                            onClick={() => { router.push("/community/notifications"); setShowUserDrop(false); }}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "#e8dbd8", fontSize: "13px", width: "100%", textAlign: "left", transition: "background 0.13s" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
                            Notifications
                          </button>
                          <button
                            onClick={() => { setShowAccountSettings(true); setShowUserDrop(false); }}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "#e8dbd8", fontSize: "13px", width: "100%", textAlign: "left", transition: "background 0.13s" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                            Settings
                          </button>
                          <button
                            onClick={() => { setShowSupport(true); setShowUserDrop(false); }}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "#e8dbd8", fontSize: "13px", width: "100%", textAlign: "left", transition: "background 0.13s" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>
                            Get support
                          </button>
                        </div>

                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "5px" }}>
                          <button
                            onClick={async () => {
                              const supabase = createClient();
                              await supabase.auth.signOut();
                              setShowUserDrop(false);
                              window.location.assign("/");
                            }}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "#a89690", fontSize: "13px", width: "100%", textAlign: "left", transition: "background 0.13s, color 0.13s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(192,57,43,0.12)"; e.currentTarget.style.color = "#e87060"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#a89690"; }}
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Log out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bell button + dropdown */}
                  <div ref={notifsRef} style={{ position: "relative", flexShrink: 0 }}>
                    <button
                      onClick={() => setShowNotifs(v => !v)}
                      title="Notifications"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: "32px", height: "32px", borderRadius: "8px",
                        background: showNotifs ? "rgba(255,255,255,0.07)" : "transparent",
                        border: "1px solid rgba(255,255,255,0.24)", color: "#e8dbd8", cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s, color 0.15s", position: "relative",
                        padding: 0,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.42)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = showNotifs ? "rgba(255,255,255,0.07)" : "transparent";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.24)";
                        e.currentTarget.style.color = "#e8dbd8";
                      }}
                    >
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 01-3.46 0"/>
                      </svg>
                      {unreadCount > 0 && (
                        <span style={{
                          position: "absolute", top: "-2px", right: "-2px",
                          width: "8px", height: "8px", borderRadius: "50%",
                          background: "#c0392b",
                          border: "1.5px solid #211817",
                        }} />
                      )}
                    </button>

                    {/* Dropdown */}
                    {showNotifs && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 10px)", right: 0,
                        width: "340px",
                        background: "#2a1f1e",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "14px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        overflow: "hidden",
                        zIndex: 200,
                      }}>
                        {/* Header */}
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "14px 16px",
                          borderBottom: "1px solid rgba(255,255,255,0.07)",
                        }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>Notifications</span>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllRead}
                              style={{
                                fontSize: "11px", color: "#a89690", background: "none",
                                border: "none", cursor: "pointer", padding: "2px 0",
                              }}
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        {/* Items */}
                        {previewItems.length === 0 ? (
                          <div style={{ padding: "28px 16px", textAlign: "center", fontSize: "13px", color: "#6b5452" }}>
                            No notifications yet
                          </div>
                        ) : (
                          <div>
                            {previewItems.map(n => (
                              <div
                                key={n.id}
                                onClick={() => {
                                  markRead(n.id);
                                  setShowNotifs(false);
                                  router.push(notifHref(n));
                                }}
                                style={{
                                  display: "flex", gap: "10px", alignItems: "flex-start",
                                  padding: "12px 16px",
                                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                                  background: n.read ? "transparent" : "rgba(192,57,43,0.07)",
                                  cursor: "pointer",
                                  transition: "background 0.15s",
                                }}
                              >
                                {/* Unread dot */}
                                <div style={{
                                  marginTop: "5px", flexShrink: 0,
                                  width: "6px", height: "6px", borderRadius: "50%",
                                  background: n.read ? "transparent" : "#c0392b",
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontSize: "12px", fontWeight: n.read ? 400 : 600,
                                    color: n.read ? "#a89690" : "#fff",
                                    marginBottom: "2px",
                                  }}>
                                    {n.title}
                                  </div>
                                  {(n.type === "welcome" || n.type === "message") && (
                                    <div style={{ fontSize: "10px", color: "#c0392b", marginBottom: "3px", fontWeight: 500 }}>
                                      @mayyascoresynth
                                    </div>
                                  )}
                                  <div style={{
                                    fontSize: "11px", color: "#6b5452",
                                    lineHeight: 1.5,
                                    overflow: "hidden",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                  }}>
                                    {n.body}
                                  </div>
                                  <div style={{ fontSize: "10px", color: "#4a3432", marginTop: "4px" }}>
                                    {timeAgo(n.created_at)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <Link
                          href="/community/notifications"
                          onClick={() => setShowNotifs(false)}
                          style={{
                            display: "block", textAlign: "center",
                            padding: "12px 16px",
                            fontSize: "12px", color: "#a89690",
                            textDecoration: "none",
                            borderTop: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          View all notifications →
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setAuthMode("signup"); setShowAuth(true); }}
                    style={{
                      fontSize: "13px", fontWeight: 500,
                      padding: "8px 18px", borderRadius: "8px",
                      background: "#fff", color: "#211817",
                      transition: "opacity 0.15s", border: "none", cursor: "pointer",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    Join Free
                  </button>
                </>
              )
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="nav-mobile-toggle"
            style={{ display: "none", alignItems: "center", justifyContent: "center", color: "#fff", padding: "4px", background: "none", border: "none", cursor: "pointer" }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileOpen
                ? <path d="M6 18L18 6M6 6l12 12" />
                : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: "fixed", top: "64px", left: 0, right: 0, bottom: 0, zIndex: 49,
          background: "rgba(33,24,23,0.98)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          overflowY: "auto",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", flex: 1 }}>

            {/* ── Logged-in user identity ── */}
            {user && (
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "16px 0 14px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                marginBottom: "4px",
              }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  background: "#c0392b", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "16px", fontWeight: 700, color: "#fff", overflow: "hidden",
                }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName || handle || ""}
                  </p>
                  <p style={{ fontSize: "12px", color: "#6b5452", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {handle ? `@${handle}` : user?.email}
                  </p>
                </div>
              </div>
            )}

            {/* ── Nav links ── */}
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: "15px", color: "#a89690",
                  padding: "13px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  textDecoration: "none", display: "block",
                }}
              >
                {l.label}
              </Link>
            ))}

            {/* ── Contact ── */}
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block", marginTop: "12px",
                padding: "12px 16px", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#e8dbd8", fontSize: "14px", fontWeight: 500,
                textAlign: "center", textDecoration: "none",
                background: "transparent",
              }}
            >
              Contact us
            </Link>

            {user ? (
              <>
                {/* ── Account actions ── */}
                <div style={{
                  marginTop: "14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}>
                  {/* My Profile */}
                  <Link
                    href={handle ? `/community/user/${handle}` : "/community"}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "13px 16px", color: "#e8dbd8", fontSize: "14px",
                      textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    My profile
                  </Link>

                  {/* Notifications */}
                  <Link
                    href="/community/notifications"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "13px 16px", color: "#e8dbd8", fontSize: "14px",
                      textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.06)",
                      position: "relative",
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 01-3.46 0"/>
                    </svg>
                    Notifications
                    {unreadCount > 0 && (
                      <span style={{
                        marginLeft: "auto",
                        background: "#c0392b", color: "#fff",
                        fontSize: "11px", fontWeight: 700,
                        padding: "2px 7px", borderRadius: "10px",
                      }}>{unreadCount}</span>
                    )}
                  </Link>

                  {/* Settings */}
                  <button
                    onClick={() => { setMobileOpen(false); setShowAccountSettings(true); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      width: "100%", padding: "13px 16px",
                      background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)",
                      color: "#e8dbd8", fontSize: "14px", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                    Settings
                  </button>

                  {/* Get support */}
                  <button
                    onClick={() => { setMobileOpen(false); setShowSupport(true); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      width: "100%", padding: "13px 16px",
                      background: "none", border: "none",
                      color: "#e8dbd8", fontSize: "14px", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
                    </svg>
                    Get support
                  </button>
                </div>

                {/* ── Log out ── */}
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    setMobileOpen(false);
                    window.location.assign("/");
                  }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    width: "100%", marginTop: "10px",
                    padding: "13px 16px", borderRadius: "10px",
                    background: "rgba(192,57,43,0.1)", color: "#e87060",
                    fontSize: "14px", fontWeight: 500,
                    border: "1px solid rgba(192,57,43,0.2)", cursor: "pointer",
                  }}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setMobileOpen(false); setAuthMode("signin"); setShowAuth(true); }}
                  style={{
                    display: "block", width: "100%", marginTop: "12px",
                    padding: "13px 16px", borderRadius: "10px",
                    background: "transparent", color: "#e8dbd8",
                    fontSize: "15px", fontWeight: 600,
                    textAlign: "center", border: "1px solid rgba(255,255,255,0.24)", cursor: "pointer",
                  }}
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setMobileOpen(false); setAuthMode("signup"); setShowAuth(true); }}
                  style={{
                    display: "block", width: "100%", marginTop: "12px",
                    padding: "14px 16px", borderRadius: "10px",
                    background: "#fff", color: "#211817",
                    fontSize: "15px", fontWeight: 600,
                    textAlign: "center", border: "none", cursor: "pointer",
                  }}
                >
                  Join Free
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {showAuth && (
        <AuthModal
          intent="download"
          initialMode={authMode}
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
      {showAccountSettings && (
        <AccountSettingsModal onClose={() => setShowAccountSettings(false)} />
      )}
      {showSupport && user && (
        <SupportModal userEmail={user.email ?? ""} onClose={() => setShowSupport(false)} />
      )}
    </>
  );
}
