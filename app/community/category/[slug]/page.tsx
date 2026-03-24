"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ALL_SCORES } from "@/lib/scores";

const CATEGORY_META: Record<string, { name: string; desc: string; image: string }> = {
  piano:     { name: "Piano",     desc: "Solo works, concertos, and accompaniment scores",          image: "/categories/detail/piano.webp" },
  strings:   { name: "Strings",   desc: "Violin, cello, viola, and ensemble arrangements",          image: "/categories/detail/strings.webp" },
  brass:     { name: "Brass",     desc: "Trumpet, trombones, horn, and brass ensemble scores",      image: "/categories/detail/brass.webp" },
  symphonic: { name: "Symphonic", desc: "Full orchestra works and grand ensemble pieces",           image: "/categories/detail/Symphomic.webp" },
  guitar:    { name: "Guitar",    desc: "Classical, acoustic, and fingerstyle guitar scores",       image: "/categories/detail/guitar.webp" },
  choir:     { name: "Choir",     desc: "Vocal ensembles, a cappella and choral arrangements",      image: "/categories/detail/choir.webp" },
};

function ScoreCard({ score }: { score: typeof ALL_SCORES[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/community/${score.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: "12px", overflow: "hidden",
          background: "#1e1513",
          border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
          transition: "all 0.2s ease",
          cursor: "pointer",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Preview */}
        <div style={{ background: "#f5f0eb", aspectRatio: "4/3", position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <Image src="/scoreimagedefaultpreview.png" alt={score.title} fill style={{ objectFit: "cover" }} />
          {hovered && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(33,24,23,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontSize: "13px", fontWeight: 500, color: "#fff",
                padding: "8px 18px", borderRadius: "20px",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}>View score</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {score.title}
          </p>
          <span style={{ fontSize: "11px", color: "#6b5452" }}>@{score.author}</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b5452" }}>
                <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {score.likes.toLocaleString()}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b5452" }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
                {score.views.toLocaleString()}
              </span>
            </div>
            <span style={{
              fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
              background: "rgba(255,255,255,0.06)",
              color: "#a89690",
            }}>
              {score.tag === "free" ? "Free" : score.price ?? "Premium"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CategoryPage() {
  const { slug } = useParams() as { slug: string };
  const meta = CATEGORY_META[slug];
  const scores = ALL_SCORES.filter(s => s.category === slug);

  if (!meta) {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: "120px", textAlign: "center", color: "#fff" }}>
          <p>Category not found.</p>
          <Link href="/community" style={{ color: "#6b8fbd" }}>← Back to community</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "64px", background: "#211817", minHeight: "100vh" }}>

        {/* Hero banner */}
        <div style={{ position: "relative", height: "280px", overflow: "hidden" }}>
          <Image src={meta.image} alt={meta.name} fill style={{ objectFit: "cover", objectPosition: "center" }} />
          {/* Overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(33,24,23,0.3) 0%, rgba(33,24,23,0.85) 100%)",
          }} />
          {/* Back link */}
          <div style={{ position: "absolute", top: "24px", left: "32px" }}>
            <Link href="/community" style={{
              fontSize: "13px", color: "rgba(255,255,255,0.7)",
              display: "flex", alignItems: "center", gap: "6px",
              textDecoration: "none", transition: "color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Community
            </Link>
          </div>
          {/* Title */}
          <div style={{ position: "absolute", bottom: "32px", left: "32px" }}>
            <h1 style={{
              fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5vw, 52px)",
              color: "#fff", fontWeight: 400, marginBottom: "8px",
            }}>
              {meta.name}
            </h1>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)" }}>{meta.desc}</p>
          </div>
        </div>

        {/* Scores */}
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 32px 80px" }} className="mob-px">

          {scores.length > 0 ? (
            <>
              <p style={{ fontSize: "13px", color: "#6b5452", marginBottom: "24px" }}>
                {scores.length} score{scores.length !== 1 ? "s" : ""}
              </p>
              <div className="mob-1col tab-2col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                {scores.map(s => <ScoreCard key={s.id} score={s} />)}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: "80px", paddingBottom: "80px" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#fff", marginBottom: "12px" }}>
                Coming soon
              </p>
              <p style={{ fontSize: "14px", color: "#6b5452", marginBottom: "32px" }}>
                We&apos;re adding {meta.name.toLowerCase()} scores to the library. Check back soon.
              </p>
              <Link href="/community" style={{
                display: "inline-block", padding: "10px 24px", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.15)", color: "#fff",
                fontSize: "13px", textDecoration: "none", transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                ← Browse all scores
              </Link>
            </div>
          )}
        </div>

      </main>
      <Footer />
    </>
  );
}
