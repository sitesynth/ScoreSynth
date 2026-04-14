"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  intent: "download" | "purchase" | "comment" | "follow" | "upload";
  scoreTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AuthModal({ intent, scoreTitle, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handleOk, setHandleOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const switchMode = (m: "signin" | "signup") => {
    setMode(m);
    setError(null);
    setHandleError(null);
    setHandleOk(false);
  };

  const checkHandle = async (val: string) => {
    if (val.length < 3) { setHandleError("At least 3 characters."); setHandleOk(false); return; }
    if (!/^[a-z0-9_]+$/.test(val)) { setHandleError("Only letters, numbers, underscores."); setHandleOk(false); return; }
    const { data } = await supabase.from("profiles").select("id").eq("handle", val).maybeSingle();
    if (data) { setHandleError("Already taken — try another."); setHandleOk(false); }
    else { setHandleError(null); setHandleOk(true); }
  };

  const handleSignUp = async () => {
    if (!displayName.trim()) { setError("Please enter your name."); return; }
    if (!handle) { setError("Please choose a username."); return; }
    if (handleError) { setError(handleError); return; }
    if (!email || !password) { setError("Please enter email and password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    setError(null);

    // Create auth user
    const { data, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) { setError(authErr.message); setLoading(false); return; }
    if (!data.user) { setError("Something went wrong. Please try again."); setLoading(false); return; }

    // Create profile
    const { error: profileErr } = await supabase.from("profiles").insert({
      id: data.user.id,
      handle: handle.toLowerCase(),
      display_name: displayName.trim(),
      bio: "",
      avatar_url: null,
      banner_url: null,
    });

    setLoading(false);

    if (profileErr) { setError("Account created but profile failed: " + profileErr.message); return; }

    onSuccess?.();
    onClose();
    router.push(`/community/user/${handle.toLowerCase()}`);
  };

  const handleSignIn = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setError(null);

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authErr) { setError(authErr.message); return; }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles").select("handle").eq("id", data.user.id).single();
      onSuccess?.();
      onClose();
      if (profile?.handle) router.push(`/community/user/${profile.handle}`);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const intentTitle = {
    download: "Sign in to download",
    purchase: "Sign in to purchase",
    comment:  "Sign in to comment",
    follow:   "Sign in to follow",
    upload:   "Sign in to upload",
  }[intent];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    background: "#1e1513",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  };

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
          padding: "36px 32px", width: "100%", maxWidth: "380px",
          display: "flex", flexDirection: "column", gap: "16px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#fff", fontWeight: 400 }}>
            {mode === "signup" ? "Create account" : intentTitle}
          </h2>
          <button onClick={onClose} style={{ color: "#6b5452", fontSize: "20px", lineHeight: 1, padding: "4px", cursor: "pointer", background: "none", border: "none" }}>×</button>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            width: "100%", padding: "12px 16px", borderRadius: "10px",
            background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer",
          }}
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

        {/* Sign up fields */}
        {mode === "signup" && (
          <>
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={60}
              style={inputStyle}
            />
            <div>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: "14px", top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "13px", color: "#6b5452", pointerEvents: "none",
                }}>@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={handle}
                  onChange={e => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                    setHandle(val);
                    setHandleError(null);
                    setHandleOk(false);
                  }}
                  onBlur={() => handle.length >= 3 && checkHandle(handle)}
                  maxLength={30}
                  style={{
                    ...inputStyle,
                    paddingLeft: "28px",
                    border: `1px solid ${handleError ? "#c0392b" : handleOk ? "rgba(100,200,100,0.4)" : "rgba(255,255,255,0.1)"}`,
                  }}
                />
              </div>
              {handleError && <p style={{ fontSize: "11px", color: "#c0392b", marginTop: "4px" }}>{handleError}</p>}
              {handleOk && <p style={{ fontSize: "11px", color: "#6b8f6b", marginTop: "4px" }}>✓ @{handle} is available</p>}
            </div>
          </>
        )}

        {/* Email + Password */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (mode === "signup" ? handleSignUp() : handleSignIn())}
          style={inputStyle}
        />

        {error && <p style={{ fontSize: "12px", color: "#c0392b", lineHeight: 1.4 }}>{error}</p>}

        <button
          onClick={mode === "signup" ? handleSignUp : handleSignIn}
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
              <button onClick={() => switchMode("signup")} style={{ color: "#a89690", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "11px", textDecoration: "underline" }}>
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => switchMode("signin")} style={{ color: "#a89690", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "11px", textDecoration: "underline" }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
