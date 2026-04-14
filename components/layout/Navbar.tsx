"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/lib/supabase/useAuth";
import AuthModal from "@/components/community/AuthModal";

const navLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "API", href: "/#api" },
  { label: "FAQ", href: "/#faq" },
  { label: "Music Scores", href: "/community" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { user, handle, loading } = useAuth();

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        height: "64px",
        background: "rgba(33,24,23,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px",
      }}>
        {/* Inner container aligned to content grid */}
        <div style={{
          maxWidth: "1100px", margin: "0 auto", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}>
            <Image src="/logos/logo-scoresynth.svg" alt="ScoreSynth" width={140} height={32} priority />
          </Link>

          {/* Desktop nav links + CTA grouped on the right */}
          <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "28px", marginLeft: "auto" }}>
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                style={{ fontSize: "13px", color: "#a89690", transition: "color 0.15s", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#a89690")}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0, marginLeft: "32px" }}>
            <Link
              href="/contact"
              style={{
                fontSize: "13px", fontWeight: 500,
                padding: "8px 16px", borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.24)",
                color: "#e8dbd8", textDecoration: "none",
                transition: "background-color 0.15s, border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.42)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.24)";
                e.currentTarget.style.color = "#e8dbd8";
              }}
            >
              Contact sales
            </Link>
            {!loading && (
              user ? (
                <>
                  <Link
                    href="/community/messages"
                    title="Messages"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "30px", height: "30px", borderRadius: "50%",
                      background: "#c0392b", border: "none",
                      color: "#fff", textDecoration: "none",
                      transition: "opacity 0.15s", flexShrink: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </Link>
                  <Link
                    href={handle ? `/community/user/${handle}` : "/community"}
                    style={{
                      fontSize: "13px", fontWeight: 500,
                      padding: "8px 18px", borderRadius: "8px",
                      background: "#fff", color: "#211817",
                      transition: "opacity 0.15s", textDecoration: "none",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    My Profile
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  style={{
                    fontSize: "13px", fontWeight: 500,
                    padding: "8px 18px", borderRadius: "8px",
                    background: "#fff", color: "#211817",
                    transition: "opacity 0.15s", border: "none", cursor: "pointer",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  Join Free
                </button>
              )
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="nav-mobile-toggle"
            style={{ display: "none", alignItems: "center", justifyContent: "center", color: "#fff", padding: "4px", background: "none", border: "none", cursor: "pointer" }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileOpen
                ? <path d="M6 18L18 6M6 6l12 12" />
                : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: "fixed", top: "64px", left: 0, right: 0, zIndex: 49,
          background: "rgba(33,24,23,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "8px 24px 28px",
          display: "flex", flexDirection: "column",
        }}>
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: "15px", color: "#a89690",
                padding: "14px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                textDecoration: "none",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setMobileOpen(false)}
            style={{
              display: "block", marginTop: "16px",
              padding: "12px 16px", borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.24)",
              color: "#e8dbd8",
              fontSize: "14px", fontWeight: 600,
              textAlign: "center", textDecoration: "none",
              background: "transparent",
            }}
          >
            Contact sales
          </Link>
          {user ? (
            <>
              <Link
                href="/community/messages"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  fontSize: "15px", color: "#a89690",
                  padding: "14px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  textDecoration: "none",
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                Messages
              </Link>
              <Link
                href={handle ? `/community/user/${handle}` : "/community"}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block", marginTop: "10px",
                  padding: "13px 16px", borderRadius: "10px",
                  background: "#fff", color: "#211817",
                  fontSize: "14px", fontWeight: 600,
                  textAlign: "center", textDecoration: "none",
                }}
              >
                My Profile
              </Link>
            </>
          ) : (
            <button
              onClick={() => { setMobileOpen(false); setShowAuth(true); }}
              style={{
                display: "block", width: "100%", marginTop: "10px",
                padding: "13px 16px", borderRadius: "10px",
                background: "#fff", color: "#211817",
                fontSize: "14px", fontWeight: 600,
                textAlign: "center", border: "none", cursor: "pointer",
              }}
            >
              Join Free
            </button>
          )}
        </div>
      )}
      {showAuth && (
        <AuthModal
          intent="download"
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
