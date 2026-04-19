"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MOCK_PROJECTS, MOCK_RECENTS } from "@/lib/app-data";
import SettingsModal from "@/components/app/SettingsModal";
import AdminModal from "@/components/app/AdminModal";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import type { Profile } from "@/lib/supabase/types";

function getBreadcrumb(pathname: string) {
  if (pathname === "/appkalababasau") return "Recents";
  if (pathname === "/appkalababasau/projects") return "All projects";
  if (pathname.startsWith("/appkalababasau/projects/")) return "All projects / Project";
  if (pathname === "/appkalababasau/saved") return "Saved Compositions";
  if (pathname === "/appkalababasau/trash") return "Trash";
  if (pathname === "/appkalababasau/community") return "Community / My Community Profile";
  return "";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userDropOpen, setUserDropOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data as Profile); });
  }, [user]);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName[0].toUpperCase();
  const handle = profile?.handle ? `@${profile.handle}` : user?.email ?? "";
  const avatarUrl = profile?.avatar_url;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"account" | "community" | "notifications" | "security">("account");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<"billing" | "plan" | "invoices">("billing");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const isActive = (path: string) =>
    path === "/appkalababasau" ? pathname === "/appkalababasau" : pathname.startsWith(path);

  const navItem = (path: string, icon: React.ReactNode, label: string) => (
    <Link
      href={path}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "8px 10px", borderRadius: "8px",
        fontSize: "13px", fontWeight: isActive(path) ? 500 : 400,
        color: isActive(path) ? "#fff" : "#a89690",
        background: isActive(path) ? "rgba(176,48,37,0.88)" : "transparent",
        textDecoration: "none", transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={e => { if (!isActive(path)) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#e8dbd8"; } }}
      onMouseLeave={e => { if (!isActive(path)) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a89690"; } }}
    >
      {icon}
      {label}
    </Link>
  );

  const filteredRecents = MOCK_RECENTS.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#211817", overflow: "hidden" }}>

      {/* ── TOPBAR ── */}
      <div style={{
        height: "52px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "#211817", zIndex: 40, position: "relative",
      }}>
        {/* Left: avatar + name + plan + bell */}
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <button
            onClick={() => setUserDropOpen(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 8px", borderRadius: "8px", transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%", background: "#c0392b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 600, color: "#fff", flexShrink: 0,
              overflow: "hidden",
            }}>
              {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#fff" }}>{displayName}</span>
            <svg width="12" height="12" fill="none" stroke="#a89690" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <span style={{
            fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px",
            background: "#1d4ed8", color: "#fff", marginLeft: "4px",
          }}>
            Pro
          </span>

          <button
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "6px", marginLeft: "6px", borderRadius: "6px",
              color: "#a89690", display: "flex", alignItems: "center", transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#a89690")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>

        {/* Center: breadcrumb */}
        <span style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          fontSize: "13px", color: "#a89690",
        }}>
          {getBreadcrumb(pathname)}
        </span>

        {/* Right: New project */}
        <button
          onClick={() => router.push("/editor/new")}
          style={{
            padding: "7px 16px", borderRadius: "8px",
            background: "#c0392b", color: "#fff",
            fontSize: "13px", fontWeight: 500,
            border: "none", cursor: "pointer", transition: "opacity 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          New project
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <div style={{
          width: "280px", flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.07)",
          background: "#211817", position: "relative", overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>

            {/* placeholder – dropdown rendered at root level */}

          {/* Normal sidebar */}
          <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto", flex: 1 }}>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#6b5452", pointerEvents: "none" }}
                width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text" placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                style={{
                  width: "100%", padding: "8px 10px 8px 30px", borderRadius: "8px",
                  fontSize: "13px", background: "#2a1f1e",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "#fff", outline: "none", boxSizing: "border-box",
                }}
              />
              {searchFocused && searchQuery && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", padding: "8px", zIndex: 30,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}>
                  {filteredRecents.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#6b5452", padding: "8px" }}>No results</p>
                  ) : (
                    <>
                      <p style={{ fontSize: "11px", color: "#6b5452", padding: "4px 8px 6px" }}>Recents</p>
                      {filteredRecents.map(r => (
                        <button key={r.id} style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          width: "100%", padding: "7px 8px", borderRadius: "6px",
                          background: "none", border: "none", cursor: "pointer", textAlign: "left",
                          transition: "background 0.15s",
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}
                        >
                          <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#c0392b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", color: "#e8dbd8" }}>{r.name}</p>
                            <p style={{ fontSize: "11px", color: "#6b5452" }}>Edited {r.updatedAt}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Recents */}
            {navItem("/appkalababasau",
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
              "Recents"
            )}

            {/* Music Community */}
            {navItem("/appkalababasau/community",
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
              "Music Community"
            )}

            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />

            {/* All Projects */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Link href="/appkalababasau/projects" style={{
                  display: "flex", alignItems: "center", gap: "10px", flex: 1,
                  padding: "8px 10px", borderRadius: "8px",
                  fontSize: "13px", fontWeight: isActive("/appkalababasau/projects") ? 500 : 400,
                  color: isActive("/appkalababasau/projects") ? "#fff" : "#a89690",
                  background: isActive("/appkalababasau/projects") ? "rgba(176,48,37,0.88)" : "transparent",
                  textDecoration: "none", transition: "background 0.15s, color 0.15s",
                }}
                  onMouseEnter={e => { if (!isActive("/appkalababasau/projects")) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#e8dbd8"; } }}
                  onMouseLeave={e => { if (!isActive("/appkalababasau/projects")) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a89690"; } }}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
                  All projects
                </Link>
                <button onClick={() => setProjectsExpanded(v => !v)} style={{
                  background: "none", border: "none", cursor: "pointer", padding: "8px 6px",
                  color: "#6b5452", display: "flex", alignItems: "center", borderRadius: "6px",
                  transition: "color 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#a89690")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                    style={{ transform: projectsExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
              {projectsExpanded && (
                <div style={{ paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "1px", marginTop: "2px" }}>
                  {MOCK_PROJECTS.map(p => (
                    <Link key={p.id} href={`/editor/${p.id}`} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "7px 10px", borderRadius: "6px",
                      fontSize: "13px", color: "#a89690",
                      textDecoration: "none", transition: "background 0.15s, color 0.15s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#e8dbd8"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a89690"; }}
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                      {p.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Compositions */}
            {navItem("/appkalababasau/saved",
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>,
              "Saved Compositions"
            )}

            {/* Trash */}
            {navItem("/appkalababasau/trash",
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>,
              "Trash"
            )}

            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />

            {/* Your Community Profile */}
            <div>
              <button onClick={() => setProjectsExpanded(v => !v)} style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: "11px", color: "#6b5452", padding: "4px 2px", marginBottom: "4px",
                transition: "color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#a89690")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
              >
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                Your Community Profile
              </button>
              {MOCK_PROJECTS.map(p => (
                <Link key={p.id} href={`/editor/${p.id}`} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "7px 10px", borderRadius: "6px",
                  fontSize: "13px", color: "#a89690",
                  textDecoration: "none", transition: "background 0.15s, color 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#e8dbd8"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a89690"; }}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                  {p.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, overflowY: "auto", background: "#211817" }}>
          {children}
        </div>
      </div>

      {/* User dropdown popover */}
      {userDropOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
            onClick={() => setUserDropOpen(false)}
          />
          {/* Compact dropdown panel */}
          <div style={{
            position: "fixed", top: "58px", left: "12px",
            width: "236px", zIndex: 50,
            background: "#1e1412",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "12px",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)",
          }}>
            {/* Identity header */}
            <div style={{ padding: "14px 14px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "50%", background: "#c0392b",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "15px", fontWeight: 600, color: "#fff", flexShrink: 0,
                overflow: "hidden",
              }}>
                {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</p>
                <p style={{ fontSize: "11px", color: "#6b5452", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{handle || user?.email}</p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "6px" }}>
              {/* View Profile */}
              <button
                onClick={() => { router.push(`/community/${handle}`); setUserDropOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 10px", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "#e8dbd8", fontSize: "13px", width: "100%", textAlign: "left", transition: "background 0.13s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                View my profile
              </button>

              {/* Settings */}
              <button
                onClick={() => { setSettingsTab("account"); setSettingsOpen(true); setUserDropOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 10px", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "#e8dbd8", fontSize: "13px", width: "100%", textAlign: "left", transition: "background 0.13s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                Settings
              </button>

              {/* Notifications shortcut */}
              <button
                onClick={() => { setSettingsTab("notifications"); setSettingsOpen(true); setUserDropOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 10px", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "#e8dbd8", fontSize: "13px", width: "100%", textAlign: "left", transition: "background 0.13s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
                Notifications
              </button>

              {/* Admin */}
              <button
                onClick={() => { setAdminTab("billing"); setAdminOpen(true); setUserDropOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 10px", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "#e8dbd8", fontSize: "13px", width: "100%", textAlign: "left", transition: "background 0.13s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                Admin
              </button>
            </div>

            {/* Log out */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "6px" }}>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.assign("/");
                }}
                style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 10px", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "#a89690", fontSize: "13px", width: "100%", textAlign: "left", transition: "background 0.13s, color 0.13s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(192,57,43,0.12)"; e.currentTarget.style.color = "#e87060"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#a89690"; }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Log out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {settingsOpen && (
        <SettingsModal
          activeTab={settingsTab}
          onTabChange={setSettingsTab}
          onClose={() => setSettingsOpen(false)}
          user={{ name: displayName, email: user?.email ?? "", handle, initials, createdAt: profile?.created_at ?? "" }}
          userId={user?.id ?? ""}
          currentAvatarUrl={avatarUrl}
          onAvatarChange={(url) => setProfile(p => p ? { ...p, avatar_url: url } : p)}
        />
      )}
      {adminOpen && (
        <AdminModal
          activeTab={adminTab}
          onTabChange={setAdminTab}
          onClose={() => setAdminOpen(false)}
        />
      )}
    </div>
  );
}
