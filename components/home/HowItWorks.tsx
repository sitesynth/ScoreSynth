"use client";

import { useState } from "react";
import Image from "next/image";

const features = [
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 19V6l12-3v13"/><circle cx="6" cy="19" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    ),
    tag: "Transcription",
    title: "Audio to sheet music in seconds",
    description: "Upload any MP3, WAV, MIDI, or even a scanned score — ScoreSynth AI reads it and produces a clean, print-ready transcription automatically.",
    image: "/assets/images/transcription.webp",
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    tag: "Arrangement",
    title: "Orchestrate any melody with AI",
    description: "Describe the style, choose your instruments, and watch AI turn a simple melody into a full orchestral arrangement — strings, brass, woodwinds and all.",
    image: "/assets/images/writeprompt.webp",
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    tag: "Composition",
    title: "Original music from a prompt",
    description: "No source file needed. Just describe the mood, genre, and instrumentation — ScoreSynth composes original sheet music from scratch.",
    image: "/assets/images/readyscore.webp",
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    tag: "Notation Editor",
    title: "Edit and refine in the browser",
    description: "A built-in score editor lets you tweak dynamics, add articulations, fix notes, and export as PDF, MusicXML, or MIDI — without leaving ScoreSynth.",
    image: "/assets/images/scoreeditor.webp",
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);

  return (
    <section id="how-it-works" style={{ padding: "96px 32px 80px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <style>{`
            @keyframes spinGear {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `}</style>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            marginBottom: "16px",
            padding: "5px 14px", borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.12)",
            fontSize: "11px", fontWeight: 600, color: "#a89690",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            <svg
              width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"
              style={{ animation: "spinGear 3s linear infinite", flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            In Development
          </span>
          <h2 style={{
            fontFamily: "Georgia, serif", fontWeight: 400,
            fontSize: "clamp(28px, 3vw, 42px)",
            color: "#fff", marginBottom: "16px", lineHeight: 1.2,
          }}>
            Everything you need to create music
          </h2>
          <p style={{
            fontSize: "15px", color: "#7a6460",
            maxWidth: "520px", margin: "0 auto", lineHeight: 1.7,
          }}>
            From raw audio to polished orchestral scores — ScoreSynth handles transcription,
            arrangement, composition, and editing in one place.
          </p>
        </div>

        <div className="mob-1col mob-gap-sm" style={{
          display: "grid", gridTemplateColumns: "1fr 1.2fr",
          gap: "64px", alignItems: "start",
        }}>

          {/* Accordion */}
          <div>
            {features.map((f, i) => (
              <div key={f.tag}>
                <button
                  onClick={() => setActive(i)}
                  style={{
                    width: "100%", textAlign: "left",
                    background: "none", border: "none", cursor: "pointer",
                    outline: "none", padding: "20px 0",
                    display: "flex", alignItems: "flex-start", gap: "14px",
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    flexShrink: 0,
                    width: "34px", height: "34px", borderRadius: "9px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: active === i ? "rgba(192,57,43,0.15)" : "rgba(255,255,255,0.05)",
                    color: active === i ? "#e87060" : "#6b5452",
                    transition: "background 0.25s, color 0.25s",
                    marginTop: "2px",
                  }}>
                    {f.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{
                        fontSize: "10px", fontWeight: 600,
                        color: active === i ? "#e87060" : "#4a3432",
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        transition: "color 0.25s",
                      }}>
                        {f.tag}
                      </span>
                    </div>
                    <p style={{
                      fontSize: "15px", fontWeight: active === i ? 500 : 400,
                      color: active === i ? "#fff" : "#6b5452",
                      transition: "color 0.25s", margin: 0,
                    }}>
                      {f.title}
                    </p>

                    {/* Expandable description */}
                    <div style={{
                      maxHeight: active === i ? "100px" : "0px",
                      overflow: "hidden",
                      transition: "max-height 0.35s ease",
                    }}>
                      <p style={{
                        fontSize: "13px", color: "#7a6360",
                        lineHeight: 1.6, marginTop: "8px", marginBottom: 0,
                      }}>
                        {f.description}
                      </p>
                    </div>
                  </div>
                </button>

                {i < features.length - 1 && (
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
                )}
              </div>
            ))}
          </div>

          {/* Illustration */}
          <div className="mob-hide" style={{
            position: "sticky", top: "96px",
            width: "100%", height: "460px",
          }}>
            {/* Glow behind image */}
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at center, rgba(192,57,43,0.08) 0%, transparent 70%)",
              borderRadius: "20px", pointerEvents: "none",
            }} />
            <Image
              src={features[active].image}
              alt={features[active].title}
              fill
              style={{ objectFit: "contain" }}
            />
          </div>

        </div>
      </div>
    </section>
  );
}
