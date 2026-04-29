"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "account" | "community" | "notifications" | "security";
type User = { name: string; email: string; handle: string; initials: string; createdAt: string };

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: "36px", height: "20px", borderRadius: "10px", flexShrink: 0,
        background: on ? "#c0392b" : "rgba(255,255,255,0.12)",
        cursor: "pointer", position: "relative", transition: "background 0.2s",
      }}
    >
      <div style={{
        width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
        position: "absolute", top: "3px",
        left: on ? "19px" : "3px",
        transition: "left 0.2s",
      }} />
    </div>
  );
}

function SubModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
      <div style={{
        background: "#2a1f1e", borderRadius: "12px",
        width: "360px", padding: "24px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8" }}>{title}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b5452" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: "8px",
  background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = { fontSize: "11px", color: "#6b5452", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" };
const actionBtnStyle: React.CSSProperties = { fontSize: "12px", color: "#6b8fbd", background: "none", border: "none", cursor: "pointer", padding: 0 };

export default function SettingsModal({ activeTab, onTabChange, onClose, user, userId, currentAvatarUrl, onAvatarChange }: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  onClose: () => void;
  user: User;
  userId: string;
  currentAvatarUrl?: string | null;
  onAvatarChange?: (url: string) => void;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl ?? null);
  const [avatarHover, setAvatarHover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [changingName, setChangingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [language, setLanguage] = useState("English");

  // Community fields
  const [displayName, setDisplayName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [changingHandle, setChangingHandle] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [handleSaving, setHandleSaving] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);
  const router = useRouter();

  // Notifications toggles
  const [notifs, setNotifs] = useState({ email: true, community: true, comments: false, billing: true });

  // Security
  const [twoFAModal, setTwoFAModal] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");

  const saveHandle = async () => {
    const trimmed = newHandle.trim();
    if (!trimmed || trimmed === handle.replace("@", "")) return;
    setHandleSaving(true);
    setHandleError(null);
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("profiles").select("id").eq("handle", trimmed).maybeSingle();
    if (existing) {
      setHandleError("This handle is already taken.");
      setHandleSaving(false);
      return;
    }
    const { error } = await supabase
      .from("profiles").update({ handle: trimmed }).eq("id", userId);
    setHandleSaving(false);
    if (error) { setHandleError("Failed to save. Try again."); return; }
    setHandle("@" + trimmed);
    setChangingHandle(false);
    router.replace(`/community/user/${trimmed}`);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setDeleteMsg(data.error || "Failed to delete account"); setDeleteLoading(false); return; }
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      setDeleteMsg("Something went wrong. Please try again.");
      setDeleteLoading(false);
    }
  };

  const tabs: Tab[] = ["account", "community", "notifications", "security"];

  const rowStyle: React.CSSProperties = { padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" };
  const rowLast: React.CSSProperties = { padding: "18px 0" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#1e1513", borderRadius: "16px",
        width: "660px", maxWidth: "94vw", maxHeight: "88vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        {/* Tabs + close */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
        }}>
          <div style={{ display: "flex" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => onTabChange(t)} style={{
                padding: "14px 16px", fontSize: "13px", fontWeight: activeTab === t ? 500 : 400,
                color: activeTab === t ? "#fff" : "#6b5452",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: activeTab === t ? "2px solid #c0392b" : "2px solid transparent",
                transition: "color 0.15s",
              }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#6b5452", padding: "4px", borderRadius: "6px",
            display: "flex", alignItems: "center", transition: "color 0.15s",
            marginRight: "-8px",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Hidden file input — always mounted so fileInputRef works on any tab */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file || !userId) return;
            setUploading(true);
            const ext = file.name.split(".").pop();
            const path = `${userId}/avatar.${ext}`;
            const supabase = createClient();
            const { error } = await supabase.storage
              .from("avatars").upload(path, file, { upsert: true });
            if (error) {
              alert("Upload failed: " + error.message);
              setUploading(false);
              e.target.value = "";
              return;
            }
            const { data } = supabase.storage.from("avatars").getPublicUrl(path);
            const url = `${data.publicUrl}?t=${Date.now()}`;
            await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
            setAvatarUrl(url);
            onAvatarChange?.(url);
            setUploading(false);
            e.target.value = "";
          }}
        />

        {/* Content */}
        <div style={{ overflowY: "auto", flex: 1 }}>

          {/* ── ACCOUNT ── */}
          {activeTab === "account" && (
            <div style={{ display: "flex", gap: "40px", padding: "32px 28px" }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={() => setAvatarHover(true)}
                  onMouseLeave={() => setAvatarHover(false)}
                  style={{
                    width: "80px", height: "80px", borderRadius: "50%",
                    background: avatarUrl ? "transparent" : "#c0392b",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "30px", fontWeight: 600, color: "#fff",
                    margin: "0 auto 10px", cursor: "pointer",
                    position: "relative", overflow: "hidden",
                    border: avatarHover ? "2px solid rgba(255,255,255,0.3)" : "2px solid transparent",
                    transition: "border-color 0.15s",
                  }}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : user.initials
                  }
                  {/* Hover / uploading overlay */}
                  {(avatarHover || uploading) && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0.5)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: "4px",
                    }}>
                      {uploading ? (
                        <span style={{ fontSize: "9px", color: "#fff", fontWeight: 500 }}>Saving…</span>
                      ) : (
                        <>
                          <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <span style={{ fontSize: "9px", color: "#fff", fontWeight: 500, lineHeight: 1 }}>Upload</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {avatarUrl && (
                  <button
                    onClick={() => setAvatarUrl(null)}
                    style={{ ...actionBtnStyle, color: "#c0392b", fontSize: "11px" }}
                  >
                    Remove
                  </button>
                )}
              </div>
              {/* Fields */}
              <div style={{ flex: 1 }}>
                <div style={rowStyle}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "4px" }}>Name</p>
                  <p style={{ fontSize: "13px", color: "#a89690", marginBottom: "6px" }}>{user.name}</p>
                  <button onClick={() => { setNewName(user.name); setChangingName(true); }} style={actionBtnStyle}>Change name</button>
                </div>
                <div style={rowStyle}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "4px" }}>Email</p>
                  <p style={{ fontSize: "13px", color: "#a89690", marginBottom: "4px" }}>{user.email}</p>
                  <p style={{ fontSize: "12px", color: "#6b5452" }}>Managed by Google</p>
                </div>
                <div style={rowStyle}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "8px" }}>Language</p>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    style={{
                      padding: "8px 12px", borderRadius: "8px", fontSize: "13px",
                      background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#e8dbd8", outline: "none", cursor: "pointer",
                    }}
                  >
                    {["English", "French", "Dutch", "German"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div style={rowLast}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "4px" }}>Account</p>
                  <p style={{ fontSize: "13px", color: "#6b5452", marginBottom: "8px" }}>Created {user.createdAt}</p>
                  <button onClick={() => setDeletingAccount(true)} style={{ ...actionBtnStyle, color: "#c0392b" }}>Delete account</button>
                </div>
              </div>
            </div>
          )}

          {/* ── COMMUNITY ── */}
          {activeTab === "community" && (
            <div style={{ display: "flex", gap: "36px", padding: "32px 28px" }}>
              {/* Left: avatar */}
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "80px", height: "80px", borderRadius: "50%", background: "#c0392b",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "30px", fontWeight: 600, color: "#fff", margin: "0 auto 8px",
                    overflow: "hidden", cursor: "pointer",
                  }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : user.initials}
                </div>
                <button onClick={() => fileInputRef.current?.click()} style={actionBtnStyle}>
                  {uploading ? "Saving…" : "Edit"}
                </button>
              </div>

              {/* Right: sections */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0" }}>
                {/* Display name */}
                <div style={rowStyle}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "4px" }}>Display name</p>
                  <p style={{ fontSize: "13px", color: "#a89690", marginBottom: "6px" }}>{displayName}</p>
                  <button onClick={() => { setNewName(displayName); setChangingName(true); }} style={actionBtnStyle}>Change name</button>
                </div>

                {/* Unique handle */}
                <div style={rowStyle}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "4px" }}>Unique handle</p>
                  <p style={{ fontSize: "13px", color: "#a89690", marginBottom: "6px" }}>{handle}</p>
                  <button onClick={() => { setNewHandle(handle.replace("@", "")); setChangingHandle(true); }} style={actionBtnStyle}>Change handle</button>
                  <p style={{ fontSize: "12px", color: "#6b5452", marginTop: "6px" }}>
                    Public profile:{" "}
                    <span style={{ color: "#6b8fbd" }}>https://www.scoresynth.com/{handle}</span>
                  </p>
                </div>

                {/* Profile */}
                <div style={rowLast}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "4px" }}>Profile</p>
                  <p style={{ fontSize: "13px", color: "#6b5452", marginBottom: "8px" }}>Created {user.createdAt}</p>
                  <button style={{ ...actionBtnStyle, color: "#c0392b" }}>Delete public profile</button>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <div style={{ padding: "32px 28px" }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "20px" }}>Notification preferences</p>
              {([
                ["email", "Email notifications", "Receive emails about your account activity"],
                ["community", "Community updates", "Get notified about new scores and composers you follow"],
                ["comments", "New comments on your scores", "Alerts when someone comments on your published scores"],
                ["billing", "Billing reminders", "Upcoming renewals and payment confirmations"],
              ] as [keyof typeof notifs, string, string][]).map(([key, label, desc]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p style={{ fontSize: "13px", color: "#e8dbd8", marginBottom: "2px" }}>{label}</p>
                    <p style={{ fontSize: "12px", color: "#6b5452" }}>{desc}</p>
                  </div>
                  <Toggle on={notifs[key]} onChange={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
                </div>
              ))}
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === "security" && (
            <div style={{ padding: "32px 28px" }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "20px" }}>Security</p>

              {/* Connected accounts */}
              <div style={rowStyle}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", marginBottom: "10px" }}>Connected accounts</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#2a1f1e", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="16" height="16" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <div>
                      <p style={{ fontSize: "13px", color: "#e8dbd8" }}>Google</p>
                      <p style={{ fontSize: "12px", color: "#6b5452" }}>{user.email}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", color: "#4caf6e", background: "rgba(76,175,110,0.12)", padding: "3px 8px", borderRadius: "4px" }}>Connected</span>
                </div>
              </div>

              {/* 2FA */}
              <div style={rowStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", marginBottom: "3px" }}>Two-factor authentication</p>
                    <p style={{ fontSize: "12px", color: "#6b5452" }}>Not enabled — add an extra layer of security</p>
                  </div>
                  <button
                    onClick={() => setTwoFAModal(true)}
                    style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer", background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "#e8dbd8", whiteSpace: "nowrap" }}
                  >
                    Enable
                  </button>
                </div>
              </div>

              {/* Active sessions */}
              <div style={rowStyle}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", marginBottom: "10px" }}>Active sessions</p>
                <div style={{ padding: "10px 12px", background: "#2a1f1e", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="14" height="14" fill="none" stroke="#a89690" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                      <div>
                        <p style={{ fontSize: "13px", color: "#e8dbd8" }}>Current session</p>
                        <p style={{ fontSize: "12px", color: "#6b5452" }}>Belgium · Chrome · Active now</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: "#4caf6e", background: "rgba(76,175,110,0.12)", padding: "3px 8px", borderRadius: "4px" }}>This device</span>
                  </div>
                </div>
                <button
                  onClick={() => alert("All other sessions have been signed out.")}
                  style={{ fontSize: "12px", color: "#c0392b", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Sign out all other sessions
                </button>
              </div>

              {/* Delete account */}
              <div style={rowLast}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", marginBottom: "3px" }}>Danger zone</p>
                <p style={{ fontSize: "12px", color: "#6b5452", marginBottom: "10px" }}>Permanently delete your account and all associated data.</p>
                <button onClick={() => setDeletingAccount(true)} style={{ fontSize: "12px", color: "#c0392b", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Delete account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Change handle sub-modal ── */}
      {changingHandle && (
        <div style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{
            background: "#2a1f1e", borderRadius: "16px",
            width: "420px", overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            {/* Banner + profile card preview */}
            <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
              <img
                src="/changehanlebanner.svg"
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {/* Profile card overlay */}
              <div style={{
                position: "absolute", bottom: "-28px", left: "24px",
                background: "#2a1f1e", borderRadius: "12px",
                padding: "10px 16px 10px 12px",
                display: "flex", alignItems: "center", gap: "10px",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                minWidth: "180px",
              }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%", background: "#c0392b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 600, color: "#fff", flexShrink: 0, overflow: "hidden",
                }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : user.initials}
                </div>
                <span style={{ fontSize: "13px", color: "#a89690" }}>
                  @{newHandle || handle.replace("@", "")}
                </span>
              </div>
            </div>

            {/* Form */}
            <div style={{ padding: "48px 24px 24px" }}>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#e8dbd8", marginBottom: "16px" }}>Change your unique profile handle</p>
              <div style={{
                display: "flex", alignItems: "center",
                background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px", overflow: "hidden",
              }}>
                <span style={{ padding: "9px 10px 9px 12px", fontSize: "13px", color: "#6b5452", whiteSpace: "nowrap" }}>
                  scoresynth.com/@
                </span>
                <input
                  type="text"
                  value={newHandle}
                  onChange={e => setNewHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 15))}
                  placeholder={handle.replace("@", "")}
                  autoFocus
                  style={{
                    flex: 1, padding: "9px 12px 9px 0", background: "none",
                    border: "none", outline: "none", fontSize: "13px", color: "#fff",
                  }}
                />
              </div>
              <p style={{ fontSize: "12px", color: "#6b5452", marginTop: "8px" }}>Up to 15 characters (letters, numbers, or _)</p>
              <p style={{ fontSize: "12px", marginTop: "6px" }}>
                <span style={{ color: "#6b8fbd", cursor: "pointer" }}>Review our Community guidelines</span>
              </p>
              {handleError && (
                <p style={{ fontSize: "12px", color: "#e87060", marginTop: "8px" }}>{handleError}</p>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
                <button onClick={() => { setChangingHandle(false); setHandleError(null); }} style={{ padding: "7px 16px", borderRadius: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89690", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={saveHandle} disabled={handleSaving || !newHandle.trim()} style={{ padding: "7px 16px", borderRadius: "8px", background: "#c0392b", border: "none", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer", opacity: handleSaving || !newHandle.trim() ? 0.5 : 1 }}>{handleSaving ? "Saving…" : "Change handle"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Change name sub-modal ── */}
      {changingName && (
        <SubModal title="Change name" onClose={() => setChangingName(false)}>
          <label style={labelStyle}>New name</label>
          <input
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Your full name"
            style={inputStyle}
            autoFocus
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
            <button onClick={() => setChangingName(false)} style={{ padding: "7px 16px", borderRadius: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89690", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => setChangingName(false)} style={{ padding: "7px 16px", borderRadius: "8px", background: "#c0392b", border: "none", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Save</button>
          </div>
        </SubModal>
      )}

      {/* ── Delete account confirmation ── */}
      {deletingAccount && (
        <SubModal title="Delete account" onClose={() => { setDeletingAccount(false); setDeleteConfirm(""); }}>
          <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.6, marginBottom: "16px" }}>
            This will permanently delete your account and all your data. This action cannot be undone.
          </p>
          <label style={labelStyle}>Type <span style={{ color: "#c0392b", fontFamily: "monospace" }}>DELETE</span> to confirm</label>
          <input
            type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            style={inputStyle}
            autoFocus
          />
          {deleteMsg && <p style={{ fontSize: "12px", color: "#e05a4e", marginBottom: "12px" }}>{deleteMsg}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
            <button onClick={() => { setDeletingAccount(false); setDeleteConfirm(""); setDeleteMsg(""); }} style={{ padding: "7px 16px", borderRadius: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89690", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== "DELETE" || deleteLoading}
              style={{ padding: "7px 16px", borderRadius: "8px", background: deleteConfirm === "DELETE" ? "#c0392b" : "rgba(192,57,43,0.3)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: deleteConfirm === "DELETE" ? "pointer" : "not-allowed" }}
            >
              {deleteLoading ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </SubModal>
      )}

      {/* ── 2FA sub-modal ── */}
      {twoFAModal && (
        <SubModal title="Enable two-factor authentication" onClose={() => setTwoFAModal(false)}>
          <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.6, marginBottom: "16px" }}>
            Two-factor authentication adds an extra layer of security to your account. You'll need your phone to sign in.
          </p>
          <div style={{ padding: "14px", background: "#1e1513", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "16px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#6b5452", marginBottom: "8px" }}>Scan with your authenticator app</p>
            <div style={{ width: "100px", height: "100px", background: "#fff", borderRadius: "8px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <rect x="0" y="0" width="80" height="80" fill="white"/>
                <rect x="5" y="5" width="30" height="30" fill="#211817"/>
                <rect x="10" y="10" width="20" height="20" fill="white"/>
                <rect x="13" y="13" width="14" height="14" fill="#211817"/>
                <rect x="45" y="5" width="30" height="30" fill="#211817"/>
                <rect x="50" y="10" width="20" height="20" fill="white"/>
                <rect x="53" y="13" width="14" height="14" fill="#211817"/>
                <rect x="5" y="45" width="30" height="30" fill="#211817"/>
                <rect x="10" y="50" width="20" height="20" fill="white"/>
                <rect x="13" y="53" width="14" height="14" fill="#211817"/>
                <rect x="45" y="45" width="8" height="8" fill="#211817"/>
                <rect x="58" y="45" width="8" height="8" fill="#211817"/>
                <rect x="45" y="58" width="8" height="8" fill="#211817"/>
                <rect x="58" y="58" width="8" height="8" fill="#211817"/>
              </svg>
            </div>
            <p style={{ fontSize: "11px", color: "#6b5452", marginTop: "8px" }}>Mock QR code — feature coming soon</p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button onClick={() => setTwoFAModal(false)} style={{ padding: "7px 16px", borderRadius: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89690", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => setTwoFAModal(false)} style={{ padding: "7px 16px", borderRadius: "8px", background: "#c0392b", border: "none", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Continue</button>
          </div>
        </SubModal>
      )}
    </div>
  );
}
