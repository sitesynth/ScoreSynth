"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/useAuth";
import { useNotifications, NotificationItem } from "@/lib/supabase/useNotifications";
import AuthModal from "@/components/community/AuthModal";

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
  const [showNotifs, setShowNotifs] = useState(false);
  const router = useRouter();
  const { user, handle, loading } = useAuth();
  const { unreadCount, items, markRead, markAllRead } = useNotifications(user?.id ?? null);
  const notifsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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

  const previewItems = items.slice(0, 5);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        height: "64px",
        background: "rgba(33,24,23,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px",
      }}>
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
              Contact sales
            </Link>
            {!loading && (
              user ? (
                <>
                  <Link
                    href={handle ? `/community/user/${handle}` : "/community"}
                    style={{
                      fontSize: "13px", fontWeight: 500,
                      padding: "8px 18px", borderRadius: "8px",
                      background: "#fff", color: "#211817",
                      transition: "opacity 0.15s", textDecoration: "none",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    My Profile
                  </Link>

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
                <button
                  onClick={() => setShowAuth(true)}
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
          position: "fixed", top: "64px", left: 0, right: 0, zIndex: 49,
          background: "rgba(33,24,23,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "8px 24px 28px",
          display: "flex", flexDirection: "column",
        }}>
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: "15px", color: "#a89690",
                padding: "14px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                textDecoration: "none",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setMobileOpen(false)}
            style={{
              display: "block", marginTop: "16px",
              padding: "12px 16px", borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.24)",
              color: "#e8dbd8",
              fontSize: "14px", fontWeight: 600,
              textAlign: "center", textDecoration: "none",
              background: "transparent",
            }}
          >
            Contact sales
          </Link>
          {user ? (
            <>
              <Link
                href="/community/notifications"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  fontSize: "15px", color: "#a89690",
                  padding: "14px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  textDecoration: "none",
                  position: "relative",
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                Notifications
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: "auto",
                    background: "#c0392b", color: "#fff",
                    fontSize: "11px", fontWeight: 700,
                    padding: "2px 6px", borderRadius: "10px",
                    fontFamily: "Arial, sans-serif",
                  }}>{unreadCount}</span>
                )}
              </Link>
              <Link
                href={handle ? `/community/user/${handle}` : "/community"}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block", marginTop: "10px",
                  padding: "13px 16px", borderRadius: "10px",
                  background: "#fff", color: "#211817",
                  fontSize: "14px", fontWeight: 600,
                  textAlign: "center", textDecoration: "none",
                }}
              >
                My Profile
              </Link>
            </>
          ) : (
            <button
              onClick={() => { setMobileOpen(false); setShowAuth(true); }}
              style={{
                display: "block", width: "100%", marginTop: "10px",
                padding: "13px 16px", borderRadius: "10px",
                background: "#fff", color: "#211817",
                fontSize: "14px", fontWeight: 600,
                textAlign: "center", border: "none", cursor: "pointer",
              }}
            >
              Join Free
            </button>
          )}
        </div>
      )}
      {showAuth && (
        <AuthModal
          intent="download"
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
