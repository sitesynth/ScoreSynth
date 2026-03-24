"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MOCK_USER, MOCK_PROJECTS, MOCK_RECENTS } from "@/lib/app-data";
import SettingsModal from "@/components/app/SettingsModal";
import AdminModal from "@/components/app/AdminModal";

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
  const [userDropOpen, setUserDropOpen] = useState(false);
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
            }}>
              {MOCK_USER.initials}
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#fff" }}>{MOCK_USER.name}</span>
            <svg width="12" height="12" fill="none" stroke="#a89690" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <span style={{
            fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px",
            background: "#1d4ed8", color: "#fff", marginLeft: "4px",
          }}>
            {MOCK_USER.plan}
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

      {/* User dropdown (fixed, outside sidebar so no overflow clip) */}
      {userDropOpen && (
        <>
          {/* Backdrop – catches outside clicks */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
            onClick={() => setUserDropOpen(false)}
          />
          {/* Dropdown panel */}
          <div style={{
            position: "fixed", top: "52px", left: 0,
            width: "280px", zIndex: 50,
            background: "#1c1210",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex", flexDirection: "column",
            padding: "20px 14px", gap: "0",
            boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
          }}>
            {/* Avatar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "16px", marginBottom: "4px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%", background: "#c0392b",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", fontWeight: 600, color: "#fff", marginBottom: "10px",
              }}>
                {MOCK_USER.initials}
              </div>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#fff", marginBottom: "3px" }}>{MOCK_USER.name}</p>
              <p style={{ fontSize: "12px", color: "#6b5452" }}>{MOCK_USER.email}</p>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "1px" }}>
              {[
                {
                  label: "Settings",
                  onClick: () => { setSettingsTab("account"); setSettingsOpen(true); setUserDropOpen(false); },
                  icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
                },
                {
                  label: "Admin",
                  onClick: () => { setAdminTab("billing"); setAdminOpen(true); setUserDropOpen(false); },
                  icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
                },
              ].map(item => (
                <button key={item.label} onClick={item.onClick} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 10px", borderRadius: "8px",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#e8dbd8", fontSize: "13px", width: "100%", textAlign: "left",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  {item.icon}{item.label}
                </button>
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "12px", marginTop: "8px" }}>
              <p style={{ fontSize: "11px", color: "#6b5452", paddingLeft: "10px", marginBottom: "8px" }}>Your Community Profile</p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#c0392b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, color: "#fff" }}>
                  {MOCK_USER.initials}
                </div>
                <div>
                  <p style={{ fontSize: "13px", color: "#e8dbd8" }}>{MOCK_USER.name}</p>
                  <p style={{ fontSize: "11px", color: "#6b5452" }}>{MOCK_USER.handle}</p>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "10px", marginTop: "8px" }}>
              <button style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 10px", borderRadius: "8px",
                background: "none", border: "none", cursor: "pointer",
                color: "#a89690", fontSize: "13px", width: "100%", textAlign: "left",
                transition: "background 0.15s, color 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#a89690"; }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
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
          user={MOCK_USER}
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
