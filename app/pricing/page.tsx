"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
    highlight: false,
    features: [
      "5 AI generations per month",
      "Score editor: 1 project, 1 page",
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
    description: "Perfect for hobbyists and students",
    cta: "Get Solo",
    href: "/app",
    highlight: true,
    features: [
      "25 AI generations per month",
      "Score editor: unlimited projects & linked pieces",
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
    description: "For professional composers and teams",
    cta: "Get Pro",
    href: "/app",
    highlight: false,
    features: [
      "50 AI generations per month",
      "Score editor: unlimited projects & linked pieces",
      "Team: 3 seats included (+€20/extra user)",
      "All export formats (PDF, XML, MIDI)",
      "Priority processing (2x faster)",
      "Commercial license",
    ],
  },
];

const packages = [
  { name: "Starter",  count: 10,  price: "€4.90",  priceNote: "€0.49 / gen" },
  { name: "Standard", count: 50,  price: "€19.90", priceNote: "€0.40 / gen" },
  { name: "Pro Pack", count: 100, price: "€34.90", priceNote: "€0.35 / gen", badge: "Best value" },
] as { name: string; count: number; price: string; priceNote: string; badge?: string }[];

const generationTypes = ["Score generation", "Transcription", "Orchestration", "MIDI export"];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "64px", background: "#211817", minHeight: "100vh" }}>

        {/* ── Page header ── */}
        <div style={{ textAlign: "center", padding: "64px 32px 48px" }}>
          <h1 style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(36px, 5vw, 52px)",
            fontWeight: 400,
            color: "#fff",
            marginBottom: "14px",
            lineHeight: 1.15,
          }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: "15px", color: "#a89690", maxWidth: "440px", margin: "0 auto", lineHeight: 1.6 }}>
            Start for free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        {/* ── Plan cards ── */}
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px" }}>
          <div
            className="mob-1col tab-2col"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}
          >
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight ? "#2e1f1d" : "#2a1f1e",
                  border: plan.highlight
                    ? "1px solid rgba(192,57,43,0.45)"
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "20px",
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  position: "relative",
                  transition: "border-color 0.2s ease",
                }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = plan.highlight
                    ? "rgba(192,57,43,0.7)"
                    : "rgba(255,255,255,0.14)")
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = plan.highlight
                    ? "rgba(192,57,43,0.45)"
                    : "rgba(255,255,255,0.06)")
                }
              >
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                    background: "#c0392b", color: "#fff",
                    fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em",
                    padding: "4px 14px", borderRadius: "20px",
                    whiteSpace: "nowrap",
                  }}>
                    Most Popular
                  </div>
                )}

                <Image src={plan.icon} alt={plan.name} width={44} height={56} style={{ opacity: 0.85 }} />

                <div>
                  <h3 style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#fff", marginBottom: "5px", fontWeight: 400 }}>
                    {plan.name}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#a89690" }}>{plan.tagline}</p>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "32px", fontWeight: 700, color: "#fff" }}>{plan.price}</span>
                    <span style={{ fontSize: "13px", color: "#a89690" }}>/ {plan.period}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#a89690", marginTop: "4px" }}>{plan.description}</p>
                </div>

                <Link
                  href={plan.href}
                  style={{
                    display: "block", width: "100%", textAlign: "center",
                    padding: "12px", borderRadius: "10px",
                    background: plan.highlight ? "#c0392b" : "#fff",
                    color: plan.highlight ? "#fff" : "#211817",
                    fontSize: "13px", fontWeight: 600,
                    transition: "opacity 0.15s",
                    boxSizing: "border-box",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  {plan.cta}
                </Link>

                <ul style={{ display: "flex", flexDirection: "column", gap: "12px", listStyle: "none", padding: 0, margin: 0 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#a89690" }}>
                      <svg style={{ flexShrink: 0, marginTop: "2px", color: plan.highlight ? "#c0392b" : "currentColor" }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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

        {/* ── Divider ── */}
        <div style={{ maxWidth: "1100px", margin: "72px auto 0", padding: "0 32px" }}>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
        </div>

        {/* ── Generation Packages ── */}
        <section id="packages" style={{ padding: "64px 32px 96px", maxWidth: "800px", margin: "0 auto" }}>

          <div style={{ marginBottom: "40px" }}>
            <p style={{ fontSize: "11px", color: "#c0392b", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "12px" }}>
              Add-on for subscribers
            </p>
            <h2 style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(28px, 4vw, 38px)",
              fontWeight: 400,
              color: "#fff",
              marginBottom: "10px",
            }}>
              Generation Packages
            </h2>
            <p style={{ fontSize: "14px", color: "#a89690", lineHeight: 1.6 }}>
              Running low? Top up your generations — available exclusively for Solo and Pro subscribers.
            </p>
          </div>

          {/* Package cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  alignItems: "center",
                  gap: "24px",
                  padding: "20px 28px",
                  background: "#2a1f1e",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  transition: "border-color 0.15s",
                  position: "relative",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)")}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)")}
              >
                {/* Name + count */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "15px", color: "#e8dbd8", fontWeight: 500 }}>{pkg.name}</span>
                  {"badge" in pkg && (
                    <span style={{
                      fontSize: "10px", fontWeight: 600, color: "#c0392b",
                      background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.25)",
                      padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.04em",
                    }}>
                      {(pkg as typeof pkg & { badge: string }).badge}
                    </span>
                  )}
                  <span style={{ fontSize: "13px", color: "#6b5452" }}>{pkg.count} generations</span>
                </div>

                {/* Per-gen price */}
                <span style={{ fontSize: "12px", color: "#6b5452", whiteSpace: "nowrap" }}>
                  {pkg.priceNote}
                </span>

                {/* Total price */}
                <span style={{ fontSize: "22px", color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {pkg.price}
                </span>
              </div>
            ))}
          </div>

          {/* Subscriber note */}
          <div style={{ marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <p style={{ fontSize: "12px", color: "#6b5452", display: "flex", alignItems: "center", gap: "7px" }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.7 }}>
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
              </svg>
              Available to purchase inside the app — requires an active Solo or Pro subscription.
            </p>
            <Link
              href="/app"
              style={{
                fontSize: "12px", fontWeight: 600, color: "#e8dbd8",
                padding: "7px 16px", borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.14)",
                textDecoration: "none", whiteSpace: "nowrap",
                transition: "border-color 0.15s, color 0.15s",
                display: "flex", alignItems: "center", gap: "6px",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#e8dbd8"; }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Go to app
            </Link>
          </div>

          {/* Works with */}
          <div style={{ marginTop: "28px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: "#6b5452", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Works with
            </span>
            {generationTypes.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: "11px", color: "#a89690",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  padding: "3px 10px", borderRadius: "20px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
