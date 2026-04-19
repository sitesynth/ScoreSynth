"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "@/components/community/AuthModal";

export default function Hero() {
  const [email, setEmail] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const handleGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <section style={{ paddingTop: "120px", paddingBottom: "80px", paddingLeft: "32px", paddingRight: "32px" }} className="mob-px">
      <div className="mob-1col mob-gap-sm" style={{
        maxWidth: "1100px", margin: "0 auto",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center",
      }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1 style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(36px, 4.5vw, 58px)",
            lineHeight: 1.1, color: "#fff",
            marginBottom: "16px",
            fontWeight: 400,
            textAlign: "center",
          }}>
            Want to be Maestro?<br />Be a Maestro.
          </h1>
          <p style={{ fontSize: "15px", color: "#a89690", marginBottom: "32px", textAlign: "center" }}>
            Let AI make your dream come true
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "340px" }}>
            {/* Google */}
            <button
              onClick={handleGoogle}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                width: "100%", padding: "12px 16px", borderRadius: "10px",
                background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: "13px", fontWeight: 500,
                cursor: "pointer", transition: "opacity 0.15s",
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
              <span style={{ fontSize: "12px", color: "#6b5452" }}>Or</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Email */}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "10px",
                background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: "13px", outline: "none",
                boxSizing: "border-box",
              }}
            />

            {/* CTA */}
            <button
              onClick={() => { setAuthMode("signup"); setShowAuth(true); }}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "10px",
                background: "#fff", color: "#211817",
                fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "opacity 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Get started free
            </button>

            <button
              onClick={() => { setAuthMode("signin"); setShowAuth(true); }}
              style={{
                width: "100%", padding: "10px 16px", borderRadius: "10px",
                background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
                color: "#e8dbd8", fontSize: "13px", fontWeight: 500, cursor: "pointer",
              }}
            >
              Already have an account? Sign in
            </button>

            <p style={{ fontSize: "11px", color: "#6b5452", textAlign: "center" }}>
              By continuing, you acknowledge Anthropic&apos;s{" "}
              <Link href="/privacy" style={{ color: "#6b5452", textDecoration: "underline" }}>Privacy Policy</Link>
            </p>
          </div>
        </div>

        {/* Right — video/image */}
        <div className="mob-hide" style={{
          position: "relative", borderRadius: "20px", overflow: "hidden",
          aspectRatio: "4/5", background: "#b5441a",
        }}>
          <video
            src="/assets/videohero.mp4"
            autoPlay muted loop playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {showAuth && (
          <AuthModal
            intent="download"
            initialMode={authMode}
            onClose={() => setShowAuth(false)}
            onSuccess={() => setShowAuth(false)}
          />
        )}
      </div>
    </section>
  );
}
