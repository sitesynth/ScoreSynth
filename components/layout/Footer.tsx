"use client";

import Link from "next/link";
import Image from "next/image";

const links = {
  Product: [
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "API", href: "/#api" },
    { label: "Music Scores", href: "/community" },
  ],
  Company: [
    { label: "FAQ", href: "/#faq" },
    { label: "Contact Sales", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Copyright Policy", href: "/copyright" },
  ],
};

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "24px", padding: "64px 32px" }} className="mob-px">
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div className="mob-1col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "40px", marginBottom: "48px" }}>
          {/* Brand */}
          <div>
            <div style={{ marginBottom: "16px" }}>
              <Image src="/logos/logo-scoresynth.svg" alt="ScoreSynth" width={130} height={30} />
            </div>
            <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.6, maxWidth: "280px" }}>
              AI-powered music transcription and orchestration. Transform any audio into professional sheet music.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a89690", marginBottom: "16px" }}>
                {section}
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px", listStyle: "none", padding: 0, margin: 0 }}>
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      style={{ fontSize: "13px", color: "#6b5452", transition: "color 0.15s", textDecoration: "none" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px" }}>
          <p style={{ fontSize: "12px", color: "#6b5452" }}>
            © {new Date().getFullYear()} ScoreSynth. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
