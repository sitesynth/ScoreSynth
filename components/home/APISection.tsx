"use client";

import Link from "next/link";

const stats = [
  { value: "< 10s", label: "Average processing time" },
  { value: "99.9%", label: "API uptime SLA" },
  { value: "50+", label: "Instrument combinations" },
  { value: "10k+", label: "Transcriptions processed daily" },
];

export default function APISection() {
  return (
    <section id="api" style={{ padding: "96px 32px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Two-col */}
        <div className="mob-1col mob-gap-sm" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center", marginBottom: "80px" }}>
          <div>
            <h2 style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(28px, 3vw, 42px)",
              color: "#fff", lineHeight: 1.2, fontWeight: 400,
            }}>
              Power your platform with ScoreSynth API
            </h2>
          </div>
          <div>
            <p style={{ fontSize: "14px", color: "#a89690", lineHeight: 1.65, marginBottom: "24px" }}>
              Integrate professional music transcription and orchestration into your product.
              Join music platforms, DAWs, and educational tools already building with ScoreSynth.
            </p>
            <Link
              href="/contact"
              style={{
                display: "inline-block",
                padding: "10px 24px", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#fff", fontSize: "13px", fontWeight: 500,
                transition: "background 0.15s",
                textDecoration: "none",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              Contact sales
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mob-2col" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              display: "flex", flexDirection: "column", gap: "12px",
              padding: "28px 24px", borderRadius: "16px",
              background: "#1e1513",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 400, color: "#fff" }}>
                {s.value}
              </span>
              <span style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.4 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
