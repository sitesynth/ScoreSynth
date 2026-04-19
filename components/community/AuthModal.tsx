"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  intent: "download" | "purchase" | "comment" | "follow" | "upload";
  scoreTitle?: string;
  initialMode?: "signin" | "signup";
  onClose: () => void;
  onSuccess?: () => void;
};

// Password rules (ГОСТ Р 57580 / best practices)
const PASSWORD_RULES = [
  { id: "len",     label: "At least 8 characters",          test: (p: string) => p.length >= 8 },
  { id: "upper",   label: "At least one uppercase letter",  test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower",   label: "At least one lowercase letter",  test: (p: string) => /[a-z]/.test(p) },
  { id: "digit",   label: "At least one number",            test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "At least one special character (!@#$%^&*…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function passwordStrength(p: string): { score: number; color: string; label: string } {
  const passed = PASSWORD_RULES.filter(r => r.test(p)).length;
  if (passed <= 2) return { score: passed, color: "#c0392b", label: "Weak" };
  if (passed === 3) return { score: passed, color: "#e67e22", label: "Fair" };
  if (passed === 4) return { score: passed, color: "#f1c40f", label: "Good" };
  return { score: passed, color: "#27ae60", label: "Strong" };
}

function PasswordRules({ password }: { password: string }) {
  if (!password) return null;
  const strength = passwordStrength(password);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {/* Strength bar */}
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: "3px", borderRadius: "2px",
            background: i <= strength.score ? strength.color : "rgba(255,255,255,0.1)",
            transition: "background 0.2s",
          }} />
        ))}
        <span style={{ fontSize: "11px", color: strength.color, marginLeft: "6px", minWidth: "40px" }}>
          {strength.label}
        </span>
      </div>
      {/* Rules checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        {PASSWORD_RULES.map(rule => {
          const ok = rule.test(password);
          return (
            <div key={rule.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                {ok
                  ? <><circle cx="6" cy="6" r="6" fill="#27ae60"/><path d="M3.5 6l2 2 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>
                  : <circle cx="6" cy="6" r="5.5" stroke="rgba(255,255,255,0.2)"/>
                }
              </svg>
              <span style={{ fontSize: "11px", color: ok ? "#a8c8a8" : "#6b5452" }}>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function AuthModal({ intent, scoreTitle, initialMode = "signin", onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handleOk, setHandleOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const switchMode = (m: "signin" | "signup") => {
    setMode(m);
    setError(null);
    setHandleError(null);
    setHandleOk(false);
    setDone(false);
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
    if (!email) { setError("Please enter your email."); return; }
    const failedRules = PASSWORD_RULES.filter(r => !r.test(password));
    if (failedRules.length > 0) { setError("Please meet all password requirements."); return; }
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }

    setLoading(true);
    setError(null);

    const { data, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          handle: handle.toLowerCase(),
          display_name: displayName.trim(),
        },
      },
    });

    if (authErr) { setError(authErr.message); setLoading(false); return; }
    if (!data.user) { setError("Something went wrong. Please try again."); setLoading(false); return; }

    setLoading(false);
    setDone(true);
  };

  const handleSignIn = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setError(null);

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authErr) { setError(authErr.message); return; }

    if (data.user) {
      onSuccess?.();
      onClose();
      router.push("/");
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

  const passwordWrap: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  };

  const eyeBtn: React.CSSProperties = {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6b5452",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", overflowY: "auto",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#2a1f1e", borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "36px 32px", width: "100%", maxWidth: "380px",
          display: "flex", flexDirection: "column", gap: "14px",
          margin: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#fff", fontWeight: 400 }}>
            {done ? "Check your email" : mode === "signup" ? "Create account" : intentTitle}
          </h2>
          <button onClick={onClose} style={{ color: "#6b5452", fontSize: "20px", lineHeight: 1, padding: "4px", cursor: "pointer", background: "none", border: "none" }}>×</button>
        </div>

        {!done && mode === "signin" && scoreTitle && (
          <p style={{ fontSize: "13px", color: "#a89690", marginTop: "-2px", marginBottom: "2px" }}>
            Continue to access <span style={{ color: "#e8dbd8", fontStyle: "italic" }}>{scoreTitle}</span>.
          </p>
        )}

        {/* Email confirmed screen */}
        {done ? (
          <>
            <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.6 }}>
              We sent a confirmation link to{" "}
              <strong style={{ color: "#e8dbd8" }}>{email}</strong>.
              <br />Click it to activate your account, then sign in.
            </p>
            <button
              onClick={() => switchMode("signin")}
              style={{
                width: "100%", padding: "12px", borderRadius: "10px",
                background: "#fff", color: "#211817", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", border: "none", marginTop: "4px",
              }}
            >
              Go to sign in
            </button>
          </>
        ) : (
          <>
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

            {/* Sign up extra fields */}
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

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />

            {/* Password */}
            <div style={passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && mode === "signin" && handleSignIn()}
                style={{ ...inputStyle, paddingRight: "40px" }}
              />
              <button style={eyeBtn} onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {/* Password rules (signup only) */}
            {mode === "signup" && password && <PasswordRules password={password} />}

            {/* Confirm password (signup only) */}
            {mode === "signup" && (
              <div style={passwordWrap}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSignUp()}
                  style={{
                    ...inputStyle,
                    paddingRight: "40px",
                    border: confirmPassword && confirmPassword !== password
                      ? "1px solid #c0392b"
                      : confirmPassword && confirmPassword === password
                      ? "1px solid rgba(100,200,100,0.4)"
                      : "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <button style={eyeBtn} onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            )}

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
          </>
        )}
      </div>
    </div>
  );
}
