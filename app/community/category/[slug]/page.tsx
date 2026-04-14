"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import type { Score } from "@/lib/supabase/types";

const CATEGORY_META: Record<string, { name: string; desc: string; image: string }> = {
  piano:      { name: "Piano & Keyboard",      desc: "Solo piano, organ, harpsichord, and accompaniment scores.",     image: "/categories/detail/piano.webp" },
  strings:    { name: "Strings",               desc: "Violin, viola, cello, double bass, and string ensembles.",      image: "/categories/detail/strings.webp" },
  woodwinds:  { name: "Woodwinds",             desc: "Flute, clarinet, oboe, saxophone, and bassoon repertoire.",     image: "/categories/detail/strings.webp" },
  brass:      { name: "Brass",                 desc: "Trumpet, trombone, french horn, tuba, and brass ensembles.",    image: "/categories/detail/brass.webp" },
  chamber:    { name: "Chamber Music",         desc: "Duos, trios, quartets, and small instrumental groups.",         image: "/categories/detail/strings.webp" },
  symphonic:  { name: "Symphonic & Orchestral",desc: "Full scores and parts for chamber and symphony orchestras.",    image: "/categories/detail/Symphomic.webp" },
  guitar:     { name: "Guitar & Fretted",      desc: "Classical guitar, acoustic, electric, and ukulele.",            image: "/categories/detail/guitar.webp" },
  choir:      { name: "Vocal & Choir",         desc: "Solo voice, art songs, opera, and choral arrangements.",        image: "/categories/detail/choir.webp" },
  percussion: { name: "Percussion",            desc: "Drums, mallets, timpani, and percussion ensembles.",            image: "/categories/detail/brass.webp" },
  soundtracks:{ name: "Soundtracks",           desc: "Music from movies, TV series, and video games.",                image: "/categories/detail/Symphomic.webp" },
};

const ALL_CATEGORIES = [
  { slug: "piano",       name: "Piano & Keyboard" },
  { slug: "strings",     name: "Strings" },
  { slug: "woodwinds",   name: "Woodwinds" },
  { slug: "brass",       name: "Brass" },
  { slug: "chamber",     name: "Chamber" },
  { slug: "symphonic",   name: "Symphonic" },
  { slug: "guitar",      name: "Guitar" },
  { slug: "choir",       name: "Vocal & Choir" },
  { slug: "percussion",  name: "Percussion" },
  { slug: "soundtracks", name: "Soundtracks" },
];

function ScoreCard({ score }: { score: Score }) {
  const [hovered, setHovered] = useState(false);
  const handle = score.profiles?.handle ?? "";

  return (
    <Link href={`/community/${score.id}`} style={{ textDecoration: "none", minWidth: 0, display: "block" }}>
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
        <div style={{ background: "#f5f0eb", position: "relative", paddingBottom: "75%", overflow: "hidden", flexShrink: 0 }}>
          <Image src="/scoreimagedefaultpreview.png" alt={score.title} fill style={{ objectFit: "contain" }} />
          {hovered && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(33,24,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#fff", padding: "8px 18px", borderRadius: "20px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)" }}>View score</span>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {score.title}
          </p>
          <span style={{ fontSize: "11px", color: "#6b5452" }}>@{handle}</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b5452" }}>
                <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {score.likes_count.toLocaleString()}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b5452" }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
                {score.views_count.toLocaleString()}
              </span>
            </div>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", color: "#a89690" }}>
              {score.tag === "free" ? "Free" : score.price_display ?? "Premium"}
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
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meta) return;
    const supabase = createClient();
    supabase
      .from("scores")
      .select("id, title, composer, tag, price_display, likes_count, views_count, category, author_id, instruments, pages, publisher, description, difficulty, midi_url, pdf_url, created_at, updated_at, profiles!scores_author_id_fkey(handle, display_name, avatar_url)")
      .eq("category", slug)
      .order("likes_count", { ascending: false })
      .then(({ data }) => {
        setScores((data as unknown as Score[]) ?? []);
        setLoading(false);
      });
  }, [slug, meta]);

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
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(33,24,23,0.3) 0%, rgba(33,24,23,0.85) 100%)",
          }} />
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

        {/* Category nav */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#1a1210" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "flex", gap: "4px", overflowX: "auto", scrollbarWidth: "none" }}>
              {ALL_CATEGORIES.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/community/category/${cat.slug}`}
                  style={{
                    padding: "14px 16px",
                    fontSize: "13px",
                    fontWeight: cat.slug === slug ? 500 : 400,
                    color: cat.slug === slug ? "#fff" : "#6b5452",
                    textDecoration: "none",
                    borderBottom: cat.slug === slug ? "2px solid #c0392b" : "2px solid transparent",
                    whiteSpace: "nowrap",
                    transition: "color 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (cat.slug !== slug) e.currentTarget.style.color = "#a89690"; }}
                  onMouseLeave={e => { if (cat.slug !== slug) e.currentTarget.style.color = "#6b5452"; }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Scores */}
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 32px 80px" }} className="mob-px">
          {loading ? (
            <p style={{ fontSize: "13px", color: "#6b5452" }}>Loading…</p>
          ) : scores.length > 0 ? (
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
