"use client";

import { useState } from "react";
import Image from "next/image";

const steps = [
  {
    id: 1,
    title: "Upload your source",
    description: "ScoreSynth accepts MP3, WAV, MIDI, MusicXML, or even scanned sheet music.",
    image: "/assets/uploadyoursource.svg",
  },
  {
    id: 2,
    title: "Write a prompt and select instruments",
    description: "Describe the orchestration style, select your instruments, and let AI do the rest.",
    image: "/assets/writeprompt.webp",
  },
  {
    id: 3,
    title: "Output: Ready-to-use sheet music",
    description: "Download your professionally arranged score as PDF, MusicXML, or MIDI.",
    image: "/assets/readyscore.webp",
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);

  return (
    <section id="how-it-works" style={{ padding: "96px 32px 64px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "Georgia, serif", fontWeight: 400,
          fontSize: "clamp(28px, 3vw, 36px)", textAlign: "center",
          marginBottom: "12px", color: "#fff",
        }}>
          How it works?
        </h2>
        <p style={{
          textAlign: "center", fontSize: "14px", color: "#a89690",
          maxWidth: "560px", margin: "0 auto 64px", lineHeight: 1.6,
        }}>
          Whether you&apos;re humming a melody, exporting a MIDI, or uploading a full demo track,
          ScoreSynth transforms your input into a professionally arranged orchestral score. Here&apos;s how:
        </p>

        <div className="mob-1col mob-gap-sm" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "64px", alignItems: "start" }}>

          {/* Steps — accordion */}
          <div>
            {steps.map((step, i) => (
              <div key={step.id}>
                <button
                  onClick={() => setActive(i)}
                  style={{
                    width: "100%", textAlign: "left",
                    background: "none", border: "none", cursor: "pointer", outline: "none",
                    padding: "20px 0",
                  }}
                >
                  <p style={{
                    fontSize: "16px",
                    fontWeight: active === i ? 500 : 400,
                    color: active === i ? "#fff" : "#6b5452",
                    transition: "color 0.25s ease",
                    marginBottom: 0,
                  }}>
                    {step.title}
                  </p>

                  {/* Animated description */}
                  <div style={{
                    maxHeight: active === i ? "80px" : "0px",
                    overflow: "hidden",
                    transition: "max-height 0.35s ease",
                  }}>
                    <p style={{
                      fontSize: "13px", color: "#7a6360",
                      lineHeight: 1.6, marginTop: "8px",
                    }}>
                      {step.description}
                    </p>
                  </div>
                </button>

                {/* Divider */}
                {i < steps.length - 1 && (
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
                )}
              </div>
            ))}
          </div>

          {/* Illustration — fixed size, no border */}
          <div className="mob-hide" style={{
            position: "relative",
            width: "100%",
            height: "480px",
            flexShrink: 0,
          }}>
            <Image
              src={steps[active].image}
              alt={steps[active].title}
              fill
              style={{ objectFit: "contain" }}
            />
          </div>

        </div>
      </div>
    </section>
  );
}
