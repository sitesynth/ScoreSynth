"use client";

import { useState } from "react";

const subjects = [
  "Bug report",
  "Feature request",
  "Account issue",
  "Billing question",
  "Other",
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  fontSize: "13px",
  outline: "none",
  background: "#2a1f1e",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#fff",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#a89690",
  marginBottom: "6px",
  display: "block",
};

export default function SupportModal({
  userEmail,
  onClose,
}: {
  userEmail: string;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, subject, message }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", zIndex: 301,
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%", maxWidth: "440px",
        background: "#1e1513",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "20px",
        padding: "32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#fff", margin: 0 }}>
              Get support
            </h2>
            <p style={{ fontSize: "12px", color: "#6b5452", margin: "4px 0 0" }}>
              We&apos;ll get back to you at {userEmail}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#6b5452", padding: "4px", borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === "sent" ? (
          <div style={{
            textAlign: "center", padding: "32px 16px",
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              background: "rgba(39,174,96,0.12)",
              border: "1px solid rgba(39,174,96,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="20" height="20" fill="none" stroke="#5dce8a" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>Message sent!</p>
            <p style={{ fontSize: "13px", color: "#7a6460", marginBottom: "24px" }}>
              We&apos;ll reply to {userEmail} as soon as possible.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "10px 24px", borderRadius: "10px",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#e8dbd8", fontSize: "13px", fontWeight: 500, cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Subject */}
            <div>
              <label style={labelStyle}>Subject *</label>
              <select
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a89690' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  cursor: "pointer",
                }}
              >
                <option value="" disabled>Select a topic</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Message */}
            <div>
              <label style={labelStyle}>Message *</label>
              <textarea
                required
                rows={5}
                placeholder="Describe your issue or question..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
              />
            </div>

            {status === "error" && (
              <p style={{ fontSize: "12px", color: "#e87060", margin: 0 }}>
                Something went wrong. Please email support@scoresynth.com directly.
              </p>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: "11px",
                  borderRadius: "10px", fontSize: "13px", fontWeight: 500,
                  background: "none", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#a89690", cursor: "pointer", transition: "border-color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.24)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === "sending"}
                style={{
                  flex: 2, padding: "11px",
                  borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                  background: "#fff", color: "#211817",
                  border: "none", cursor: status === "sending" ? "default" : "pointer",
                  opacity: status === "sending" ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => { if (status !== "sending") e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={e => { if (status !== "sending") e.currentTarget.style.opacity = "1"; }}
              >
                {status === "sending" ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
