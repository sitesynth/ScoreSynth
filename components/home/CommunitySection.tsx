"use client";

import Link from "next/link";

const features = [
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M9 19V6l12-3v13" /><circle cx="6" cy="19" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    ),
    title: "Share sheet music",
    desc: "Upload and share your scores with musicians around the world.",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: "Connect with musicians",
    desc: "Follow composers, discover new arrangements, and grow your network.",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    title: "Leave feedback",
    desc: "Comment, like, and exchange ideas on scores from the community.",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
    title: "Free to use now",
    desc: "The portal is live today — no waitlist, no subscription required.",
  },
];

export default function CommunitySection() {
  return (
    <section style={{ padding: "80px 32px", position: "relative", overflow: "hidden" }}>
      {/* subtle background glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px", height: "300px",
        background: "radial-gradient(ellipse, rgba(192,57,43,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
        {/* Badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "5px 14px", borderRadius: "20px",
            border: "1px solid rgba(192,57,43,0.4)",
            background: "rgba(192,57,43,0.08)",
            fontSize: "12px", fontWeight: 600, color: "#e87060",
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#e87060", display: "inline-block" }} />
            Live now
          </span>
        </div>

        {/* Heading */}
        <h2 style={{
          fontFamily: "Georgia, serif", fontWeight: 400,
          fontSize: "clamp(28px, 3vw, 42px)",
          textAlign: "center", color: "#fff",
          marginBottom: "16px", lineHeight: 1.2,
        }}>
          While the app is in development —<br />
          <span style={{ color: "#a89690" }}>our music community is already live</span>
        </h2>
        <p style={{
          textAlign: "center", fontSize: "16px", color: "#7a6460",
          maxWidth: "560px", margin: "0 auto 56px", lineHeight: 1.7,
        }}>
          Discover, share, and exchange sheet music with musicians worldwide.
          No waitlist — join the portal today and start exploring.
        </p>

        {/* Feature grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px", marginBottom: "48px",
        }}>
          {features.map((f) => (
            <div key={f.title} style={{
              background: "#1e1513",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px", padding: "24px",
              transition: "border-color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
            >
              <div style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: "rgba(192,57,43,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#e87060", marginBottom: "14px",
              }}>
                {f.icon}
              </div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "6px" }}>{f.title}</p>
              <p style={{ fontSize: "13px", color: "#7a6460", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Link
            href="/community"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "13px 28px", borderRadius: "12px",
              background: "#fff", color: "#211817",
              fontSize: "14px", fontWeight: 600,
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Explore the community
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
