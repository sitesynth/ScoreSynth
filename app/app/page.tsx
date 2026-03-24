"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function AppPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#211817",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px",
      textAlign: "center",
    }}>

      {/* Logo */}
      <Link href="/" style={{ marginBottom: "48px", opacity: 0.7, transition: "opacity 0.15s", display: "inline-block" }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
      >
        <Image src="/logos/logo-scoresynth.svg" alt="ScoreSynth" width={140} height={32} priority />
      </Link>

      {/* Badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "7px",
        background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.25)",
        color: "#c0392b", fontSize: "11px", fontWeight: 600,
        letterSpacing: "0.08em", textTransform: "uppercase",
        padding: "5px 14px", borderRadius: "20px", marginBottom: "28px",
      }}>
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%", background: "#c0392b",
          display: "inline-block",
          animation: "pulse 2s infinite",
        }} />
        In development
      </div>

      {/* Heading */}
      <h1 style={{
        fontFamily: "Georgia, serif",
        fontSize: "clamp(32px, 5vw, 52px)",
        fontWeight: 400,
        color: "#fff",
        marginBottom: "16px",
        lineHeight: 1.15,
        maxWidth: "560px",
      }}>
        The app is on its way
      </h1>

      <p style={{
        fontSize: "15px", color: "#a89690", lineHeight: 1.7,
        maxWidth: "420px", marginBottom: "44px",
      }}>
        We&apos;re building something great. Leave your email and we&apos;ll let you know the moment ScoreSynth launches.
      </p>

      {/* Email form */}
      {!submitted ? (
        <div style={{
          display: "flex", gap: "10px", width: "100%", maxWidth: "400px",
          flexWrap: "wrap", justifyContent: "center",
        }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && email) setSubmitted(true); }}
            style={{
              flex: 1, minWidth: "200px",
              padding: "12px 16px", borderRadius: "10px",
              background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", fontSize: "14px", outline: "none",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={() => { if (email) setSubmitted(true); }}
            style={{
              padding: "12px 24px", borderRadius: "10px",
              background: "#fff", color: "#211817",
              fontSize: "13px", fontWeight: 600,
              border: "none", cursor: "pointer",
              transition: "opacity 0.15s", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Notify me
          </button>
        </div>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          padding: "12px 24px", borderRadius: "10px", color: "#a89690", fontSize: "14px",
        }}>
          <svg width="16" height="16" fill="none" stroke="#c0392b" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" />
          </svg>
          You&apos;re on the list — we&apos;ll be in touch!
        </div>
      )}

      {/* Back link */}
      <Link
        href="/"
        style={{
          marginTop: "40px", fontSize: "13px", color: "#6b5452",
          textDecoration: "none", transition: "color 0.15s",
          display: "flex", alignItems: "center", gap: "6px",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#a89690")}
        onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to homepage
      </Link>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
