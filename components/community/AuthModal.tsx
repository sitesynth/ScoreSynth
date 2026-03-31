"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  intent: "download" | "purchase" | "comment" | "follow";
  scoreTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AuthModal({ intent, scoreTitle, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const supabase = createClient();

  const handleEmailAuth = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setError(null);
    const { error: authError } = mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    if (mode === "signup") { setDone(true); return; }
    onSuccess?.();
    onClose();
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
  };

  const intentTitle = {
    download: "Sign in to download",
    purchase: "Sign in to purchase",
    comment: "Sign in to comment",
    follow: "Sign in to follow",
  }[intent];

  const intentDesc = {
    download: <>Create a free account or sign in to download <em style={{ color: "#e8dbd8" }}>{scoreTitle}</em>.</>,
    purchase: <>Create a free account or sign in to purchase <em style={{ color: "#e8dbd8" }}>{scoreTitle}</em>.</>,
    comment: "Create a free account or sign in to leave a comment.",
    follow: "Create a free account or sign in to follow this user.",
  }[intent];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#2a1f1e", borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "36px 32px", width: "100%", maxWidth: "360px",
          display: "flex", flexDirection: "column", gap: "16px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#fff", fontWeight: 400 }}>
            {done ? "Check your email" : intentTitle}
          </h2>
          <button
            onClick={onClose}
            style={{ color: "#6b5452", fontSize: "20px", lineHeight: 1, padding: "4px", cursor: "pointer", background: "none", border: "none" }}
          >
            ×
          </button>
        </div>

        {done ? (
          <>
            <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.5 }}>
              We sent a confirmation link to <strong style={{ color: "#e8dbd8" }}>{email}</strong>. Click it to activate your account, then come back and sign in.
            </p>
            <button
              onClick={() => { setDone(false); setMode("signin"); }}
              style={{
                width: "100%", padding: "12px", borderRadius: "10px",
                background: "#fff", color: "#211817", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", border: "none",
              }}
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.5, marginBottom: "4px" }}>
              {intentDesc}
            </p>

            {/* Google */}
            <button
              onClick={handleGoogle}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                width: "100%", padding: "12px 16px", borderRadius: "10px",
                background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: "12px", color: "#6b5452" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Email + Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: "10px",
                  background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box",
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: "10px",
                  background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <p style={{ fontSize: "12px", color: "#c0392b", lineHeight: 1.4 }}>{error}</p>
            )}

            <button
              onClick={handleEmailAuth}
              disabled={loading}
              style={{
                width: "100%", padding: "12px", borderRadius: "10px",
                background: "#fff", color: "#211817", fontSize: "13px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", border: "none",
                opacity: loading ? 0.7 : 1, transition: "opacity 0.15s",
              }}
            >
              {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>

            <p style={{ fontSize: "11px", color: "#6b5452", textAlign: "center" }}>
              {mode === "signin" ? (
                <>Don&apos;t have an account?{" "}
                  <button onClick={() => { setMode("signup"); setError(null); }} style={{ color: "#a89690", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "11px", textDecoration: "underline" }}>
                    Sign up
                  </button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button onClick={() => { setMode("signin"); setError(null); }} style={{ color: "#a89690", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "11px", textDecoration: "underline" }}>
                    Sign in
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
