"use client";

import Image from "next/image";
import Link from "next/link";

const plans = [
  {
    icon: "/assets/icons/16note.svg",
    name: "Free",
    tagline: "Try ScoreSynth",
    price: "$0",
    period: "month",
    description: "Free for everyone",
    cta: "Get Free",
    href: "/app",
    features: [
      "5 transcriptions per month",
      "Basic orchestrations",
      "PDF export",
      "AI preview playback",
    ],
  },
  {
    icon: "/assets/icons/8note.svg",
    name: "Solo",
    tagline: "For everyday productivity",
    price: "$19",
    period: "month",
    description: "Perfect for hobbyists and students creating their own music",
    cta: "Get Solo",
    href: "/app",
    features: [
      "30 transcriptions per month",
      "All orchestration types",
      "PDF + MusicXML export",
      "Priority processing",
      "Commercial use license",
    ],
  },
  {
    icon: "/assets/icons/halfnote.svg",
    name: "Pro",
    tagline: "2x more usage than Solo",
    price: "$49",
    period: "month",
    description: "For professional composers and producers who need more",
    cta: "Get Pro",
    href: "/app",
    features: [
      "60 transcriptions per month",
      "All export formats (PDF, XML, MIDI)",
      "Priority processing (2x faster)",
      "Commercial license",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" style={{ padding: "48px 32px 96px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div className="mob-1col tab-2col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: "#2a1f1e",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.14)")}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)")}
            >
              {/* Icon */}
              <Image src={plan.icon} alt={plan.name} width={48} height={60} style={{ opacity: 0.85 }} />

              {/* Name + tagline */}
              <div>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: "28px", color: "#fff", marginBottom: "6px", fontWeight: 400 }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: "13px", color: "#a89690" }}>{plan.tagline}</p>
              </div>

              {/* Price */}
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 600, color: "#fff" }}>{plan.price}</span>
                  <span style={{ fontSize: "13px", color: "#a89690" }}>/ {plan.period}</span>
                </div>
                <p style={{ fontSize: "13px", color: "#a89690", marginTop: "4px" }}>{plan.description}</p>
              </div>

              {/* CTA */}
              <Link
                href={plan.href}
                style={{
                  display: "block", width: "100%", textAlign: "center",
                  padding: "12px", borderRadius: "10px",
                  background: "#fff", color: "#211817",
                  fontSize: "13px", fontWeight: 600,
                  transition: "opacity 0.15s",
                  boxSizing: "border-box",
                  textDecoration: "none",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                {plan.cta}
              </Link>

              {/* Features */}
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px", listStyle: "none", padding: 0, margin: 0 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#a89690" }}>
                    <svg style={{ flexShrink: 0, marginTop: "2px" }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
