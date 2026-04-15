"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Tab = "email" | "password" | "danger";

export default function AccountSettingsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("email");
  const router = useRouter();

  // Email tab
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Password tab
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete tab
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteMsg, setDeleteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleEmailChange() {
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    setEmailMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailLoading(false);
    if (error) setEmailMsg({ ok: false, text: error.message });
    else setEmailMsg({ ok: true, text: "Confirmation sent to your new email. Check your inbox." });
  }

  async function handlePasswordChange() {
    if (newPassword.length < 6) {
      setPasswordMsg({ ok: false, text: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: "Passwords don't match." });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) setPasswordMsg({ ok: false, text: error.message });
    else {
      setPasswordMsg({ ok: true, text: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleteLoading(true);
    setDeleteMsg(null);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteMsg({ ok: false, text: data.error || "Failed to delete account." });
        setDeleteLoading(false);
        return;
      }
      // Sign out client-side and redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setDeleteMsg({ ok: false, text: "Something went wrong. Please try again." });
      setDeleteLoading(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "email", label: "Email" },
    { id: "password", label: "Password" },
    { id: "danger", label: "Delete account" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", zIndex: 301,
        transform: "translate(-50%, -50%)",
        width: "min(460px, calc(100vw - 32px))",
        background: "#1e1412",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "16px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>Account Settings</span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b5452", padding: "4px", display: "flex" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px", padding: "8px 8px 0",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 14px", fontSize: "13px", fontWeight: 500,
                background: "none", border: "none", cursor: "pointer",
                borderRadius: "8px 8px 0 0",
                color: tab === t.id ? (t.id === "danger" ? "#e87060" : "#fff") : "#6b5452",
                borderBottom: tab === t.id ? `2px solid ${t.id === "danger" ? "#c0392b" : "#c0392b"}` : "2px solid transparent",
                transition: "color 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "24px 20px" }}>

          {/* ── EMAIL TAB ── */}
          {tab === "email" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <p style={{ fontSize: "13px", color: "#a89690", margin: 0 }}>
                Enter a new email address. We'll send a confirmation link before the change takes effect.
              </p>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b5452", marginBottom: "6px" }}>New email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "8px",
                    background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.09)",
                    color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                />
              </div>
              {emailMsg && (
                <p style={{ fontSize: "12px", color: emailMsg.ok ? "#6fcf97" : "#e87060", margin: 0 }}>
                  {emailMsg.text}
                </p>
              )}
              <button
                onClick={handleEmailChange}
                disabled={emailLoading || !newEmail.trim()}
                style={{
                  padding: "10px 20px", borderRadius: "8px",
                  background: "#c0392b", color: "#fff",
                  fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer",
                  opacity: emailLoading || !newEmail.trim() ? 0.5 : 1,
                  alignSelf: "flex-start", transition: "opacity 0.15s",
                }}
              >
                {emailLoading ? "Sending…" : "Update email"}
              </button>
            </div>
          )}

          {/* ── PASSWORD TAB ── */}
          {tab === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <p style={{ fontSize: "13px", color: "#a89690", margin: 0 }}>
                Choose a new password. Minimum 6 characters.
              </p>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b5452", marginBottom: "6px" }}>New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "8px",
                    background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.09)",
                    color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b5452", marginBottom: "6px" }}>Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "8px",
                    background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.09)",
                    color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                />
              </div>
              {passwordMsg && (
                <p style={{ fontSize: "12px", color: passwordMsg.ok ? "#6fcf97" : "#e87060", margin: 0 }}>
                  {passwordMsg.text}
                </p>
              )}
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading || !newPassword || !confirmPassword}
                style={{
                  padding: "10px 20px", borderRadius: "8px",
                  background: "#c0392b", color: "#fff",
                  fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer",
                  opacity: passwordLoading || !newPassword || !confirmPassword ? 0.5 : 1,
                  alignSelf: "flex-start", transition: "opacity 0.15s",
                }}
              >
                {passwordLoading ? "Saving…" : "Update password"}
              </button>
            </div>
          )}

          {/* ── DELETE TAB ── */}
          {tab === "danger" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                padding: "12px 14px", borderRadius: "8px",
                background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.25)",
              }}>
                <p style={{ fontSize: "13px", color: "#e87060", margin: 0, fontWeight: 500 }}>
                  This action is permanent and cannot be undone.
                </p>
                <p style={{ fontSize: "12px", color: "#a89690", margin: "6px 0 0" }}>
                  Your profile, scores, and all data will be permanently deleted.
                </p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b5452", marginBottom: "6px" }}>
                  Type <strong style={{ color: "#e87060" }}>DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "8px",
                    background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.09)",
                    color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(192,57,43,0.4)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                />
              </div>
              {deleteMsg && (
                <p style={{ fontSize: "12px", color: deleteMsg.ok ? "#6fcf97" : "#e87060", margin: 0 }}>
                  {deleteMsg.text}
                </p>
              )}
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirm !== "DELETE"}
                style={{
                  padding: "10px 20px", borderRadius: "8px",
                  background: deleteConfirm === "DELETE" ? "#c0392b" : "#2a1f1e",
                  color: deleteConfirm === "DELETE" ? "#fff" : "#4a3432",
                  border: `1px solid ${deleteConfirm === "DELETE" ? "#c0392b" : "rgba(255,255,255,0.07)"}`,
                  fontSize: "13px", fontWeight: 600, cursor: deleteConfirm === "DELETE" ? "pointer" : "not-allowed",
                  alignSelf: "flex-start", transition: "all 0.15s",
                  opacity: deleteLoading ? 0.6 : 1,
                }}
              >
                {deleteLoading ? "Deleting…" : "Permanently delete my account"}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
