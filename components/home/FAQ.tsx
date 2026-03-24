"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Who owns the music I generate with ScoreSynth?",
    a: "You do. All music you create using ScoreSynth belongs entirely to you. We don't claim any rights to your compositions.",
  },
  {
    q: "Can I use ScoreSynth to arrange copyrighted songs?",
    a: "You can arrange copyrighted songs for personal practice, but distributing or publishing arrangements of copyrighted works requires permission from the rights holders. Our commercial license covers original works only.",
  },
  {
    q: "What happens to my music if I cancel my subscription?",
    a: "Your projects and scores remain accessible for 30 days after cancellation. After that, they are archived. You can reactivate your subscription at any time to regain full access.",
  },
  {
    q: "Can I upgrade or downgrade my plan anytime?",
    a: "Yes, you can switch plans at any time. Upgrades take effect immediately, and downgrades apply at the start of your next billing cycle.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ padding: "96px 32px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 3vw, 36px)", textAlign: "center", marginBottom: "48px", color: "#fff", fontWeight: 400 }}>
          Frequently asked questions
        </h2>

        <div>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  textAlign: "left",
                  gap: "16px",
                  padding: "20px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8" }}>
                  {faq.q}
                </span>
                <span style={{
                  color: "#c0392b",
                  fontSize: "20px",
                  flexShrink: 0,
                  lineHeight: 1,
                  display: "inline-block",
                  transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                }}>
                  +
                </span>
              </button>

              {/* Animated answer */}
              <div style={{
                maxHeight: open === i ? "200px" : "0px",
                overflow: "hidden",
                transition: "max-height 0.35s ease",
              }}>
                <p style={{
                  fontSize: "14px",
                  color: "#a89690",
                  lineHeight: 1.65,
                  paddingBottom: "20px",
                }}>
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
