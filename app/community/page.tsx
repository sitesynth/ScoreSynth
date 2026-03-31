"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import type { Score } from "@/lib/supabase/types";
import { SCORE_TAGS } from "@/lib/scores";

function ScoreCard({ score }: { score: Score }) {
  const [hovered, setHovered] = useState(false);
  const handle = score.profiles?.handle ?? "";

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
        {/* Sheet music preview */}
        <div style={{ background: "#f5f0eb", aspectRatio: "4/3", position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <Image src="/scoreimagedefaultpreview.png" alt={score.title} fill style={{ objectFit: "cover" }} />
          {hovered && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(33,24,23,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "opacity 0.2s",
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
        <div style={{ padding: "12px 14px 14px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {score.title}
          </p>

          <Link
            href={`/community/user/${handle}`}
            onClick={e => e.stopPropagation()}
            style={{ fontSize: "11px", color: "#6b5452", textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#a89690")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
          >
            @{handle}
          </Link>

          {/* Bottom row */}
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
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {score.views_count.toLocaleString()}
              </span>
            </div>
            <span style={{
              fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
              background: "rgba(255,255,255,0.06)",
              color: "#a89690",
            }}>
              {score.tag === "free" ? "Free" : score.price_display ?? "Premium"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}


export default function CommunityPage() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [pianoScores, setPianoScores] = useState<Score[]>([]);
  const [brassScores, setBrassScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchScores() {
      const { data } = await supabase
        .from("scores")
        .select("id, title, composer, tag, price_display, likes_count, views_count, category, author_id, profiles(handle, display_name, avatar_url)")
        .order("likes_count", { ascending: false });

      if (data) {
        const scores = data as unknown as Score[];
        setPianoScores(scores.filter(s => s.category === "piano"));
        setBrassScores(scores.filter(s => s.category === "brass"));
      }
      setLoading(false);
    }
    fetchScores();
  }, []);

  const filterScores = (scores: Score[]) => {
    if (!query) return scores;
    const q = query.toLowerCase();
    return scores.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.composer.toLowerCase().includes(q)
    );
  };

  const filteredPiano = filterScores(pianoScores);
  const filteredBrass = filterScores(brassScores);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "80px", background: "#211817", minHeight: "100vh" }}>

        {/* Hero + Search */}
        <section style={{ textAlign: "center", padding: "64px 32px 40px" }}>
          <h1 style={{
            fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)",
            color: "#fff", lineHeight: 1.2, maxWidth: "620px", margin: "0 auto 12px"
          }}>
            Discover original scores and community arrangements
          </h1>
          <p style={{ fontSize: "14px", color: "#a89690", marginBottom: "28px" }}>
            Browse, download, and reimagine music your way.
          </p>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: "480px", margin: "0 auto 20px" }}>
            <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#6b5452", pointerEvents: "none" }}
              width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search scores, composers, arrangements…"
              style={{
                width: "100%", padding: "11px 16px 11px 42px", borderRadius: "8px",
                background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: "14px", outline: "none",
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            {SCORE_TAGS.map(tag => (
              <button key={tag} onClick={() => setActiveTag(tag)} style={{
                padding: "6px 16px", borderRadius: "20px", fontSize: "13px",
                cursor: "pointer", transition: "all 0.15s",
                background: activeTag === tag ? "#fff" : "rgba(255,255,255,0.05)",
                color: activeTag === tag ? "#211817" : "#a89690",
                border: `1px solid ${activeTag === tag ? "#fff" : "rgba(255,255,255,0.1)"}`,
                fontWeight: activeTag === tag ? 500 : 400,
              }}>
                {tag}
              </button>
            ))}
          </div>
        </section>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px 80px" }} className="mob-px">

          {/* Best of Piano */}
          <section style={{ marginBottom: "64px" }}>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#fff", marginBottom: "4px" }}>Best of Piano</h2>
              <p style={{ fontSize: "13px", color: "#7a6360" }}>The most searched and loved piano scores in the community.</p>
            </div>
            {loading ? (
              <p style={{ fontSize: "13px", color: "#6b5452" }}>Loading…</p>
            ) : (
              <div className="mob-1col tab-2col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                {filteredPiano.map(s => <ScoreCard key={s.id} score={s} />)}
              </div>
            )}
          </section>

          {/* Popular Categories */}
          <section style={{ marginBottom: "64px" }}>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "28px", color: "#fff", marginBottom: "8px" }}>Popular categories</h2>
              <p style={{ fontSize: "13px", color: "#7a6360" }}>Explore scores by instrument and style.</p>
            </div>
            <div className="mob-1col tab-2col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[
                { name: "Piano", desc: "Solo works, concertos, and accompaniment scores", image: "/categories/piano.png" },
                { name: "Strings", desc: "Violin, cello, viola, and ensemble arrangements", image: "/categories/strings-v2.png" },
                { name: "Brass", desc: "Trumpet, trombones, horn, and brass ensemble scores", image: "/categories/brass.png" },
                { name: "Symphonic", desc: "Full orchestra works and grand ensemble pieces", image: "/categories/Symphomic.png" },
                { name: "Guitar", desc: "Classical, acoustic, and fingerstyle guitar scores", image: "/categories/guitar.png" },
                { name: "Choir", desc: "Vocal ensembles, a cappella and choral arrangements", image: "/categories/choir.png" },
              ].map(cat => (
                <Link key={cat.name} href={`/community/category/${cat.name.toLowerCase()}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#1e1513", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "12px", overflow: "hidden", cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.18)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)")}
                  >
                    <div style={{ padding: "16px 18px", flex: 1 }}>
                      <p style={{ fontFamily: "Georgia, serif", fontSize: "16px", color: "#fff", marginBottom: "4px" }}>{cat.name}</p>
                      <p style={{ fontSize: "12px", color: "#7a6360", lineHeight: 1.5 }}>{cat.desc}</p>
                    </div>
                    <div style={{ width: "110px", minWidth: "110px", alignSelf: "stretch", position: "relative", flexShrink: 0 }}>
                      <Image src={cat.image} alt={cat.name} fill style={{ objectFit: "cover", objectPosition: "center" }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Brass Bands */}
          <section style={{ marginBottom: "64px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#fff", marginBottom: "4px" }}>Brass Bands</h2>
                <p style={{ fontSize: "13px", color: "#7a6360" }}>Arrangements for brass ensembles, orchestras, and wind bands.</p>
              </div>
              <Link href="/community/category/brass" style={{ fontSize: "13px", color: "#6b8fbd", textDecoration: "none", whiteSpace: "nowrap" }}>
                Browse all scores →
              </Link>
            </div>
            {loading ? (
              <p style={{ fontSize: "13px", color: "#6b5452" }}>Loading…</p>
            ) : (
              <div className="mob-1col tab-2col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                {filteredBrass.map(s => <ScoreCard key={s.id} score={s} />)}
              </div>
            )}
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
