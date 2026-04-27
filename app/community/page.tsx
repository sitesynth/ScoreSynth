"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import type { Score } from "@/lib/supabase/types";
import { SCORE_TAGS } from "@/lib/scores";
import ScoreCard from "@/components/community/ScoreCard";

const TAG_TO_CATEGORY: Record<string, string> = {
  Piano:      "piano",
  Strings:    "strings",
  Woodwinds:  "woodwinds",
  Brass:      "brass",
  Guitar:     "guitar",
  Percussion: "percussion",
  Choir:      "choir",
  Chamber:    "chamber",
  Orchestra:  "symphonic",
  Jazz:       "jazz",
  Soundtracks:"soundtracks",
};

export default function CommunityPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("scores")
      .select("id, title, composer, tag, price_display, likes_count, views_count, category, author_id, cover_url, instruments, parts, created_at, profiles!scores_author_id_fkey(handle, display_name, avatar_url)")
      .order("likes_count", { ascending: false })
      .then(({ data }) => {
        setAllScores((data as unknown as Score[]) ?? []);
        setLoading(false);
      });
  }, []);

  // ── Search / filter logic ─────────────────────────────────────────────────
  const isSearching = query.trim() !== "" || activeTag !== "All";

  const filteredScores = useMemo(() => {
    let scores = allScores;
    // Tag filter
    if (activeTag !== "All") {
      const cat = TAG_TO_CATEGORY[activeTag];
      if (cat) scores = scores.filter(s => s.category === cat);
    }
    // Text filter
    const q = query.trim().toLowerCase();
    if (q) {
      scores = scores.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.composer.toLowerCase().includes(q) ||
        s.profiles?.handle?.toLowerCase().includes(q) ||
        s.profiles?.display_name?.toLowerCase().includes(q)
      );
    }
    return scores;
  }, [allScores, query, activeTag]);

  // Unique matching profiles (for handle search)
  const matchedProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    const profiles: { handle: string; display_name: string; avatar_url: string | null }[] = [];
    for (const s of allScores) {
      const p = s.profiles;
      if (!p || seen.has(p.handle)) continue;
      if (p.handle.toLowerCase().includes(q) || p.display_name?.toLowerCase().includes(q)) {
        seen.add(p.handle);
        profiles.push(p);
      }
    }
    return profiles.slice(0, 6);
  }, [allScores, query]);

  // Homepage sections (no search active)
  const newScores   = useMemo(() => [...allScores].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6), [allScores]);
  const pianoScores = useMemo(() => allScores.filter(s => s.category === "piano"), [allScores]);
  const brassScores = useMemo(() => allScores.filter(s => s.category === "brass"), [allScores]);

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    setQuery("");
  };

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "80px", background: "#211817", minHeight: "100vh" }}>

        {/* Hero + Search */}
        <section style={{ textAlign: "center", padding: "48px 20px 36px" }} className="mob-px">
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
              type="text" value={query}
              onChange={e => { setQuery(e.target.value); setActiveTag("All"); }}
              placeholder="Search scores, composers, @handle…"
              style={{
                width: "100%", padding: "11px 40px 11px 42px", borderRadius: "8px",
                background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{
                position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#6b5452", cursor: "pointer",
                display: "flex", alignItems: "center", padding: 0,
              }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            {SCORE_TAGS.map(tag => (
              <button key={tag} onClick={() => handleTagClick(tag)} style={{
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

          {/* ── SEARCH / FILTER RESULTS ── */}
          {isSearching ? (
            <div>
              {/* Matched profiles */}
              {matchedProfiles.length > 0 && (
                <div style={{ marginBottom: "36px" }}>
                  <p style={{ fontSize: "12px", color: "#6b5452", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                    Composers & arrangers
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {matchedProfiles.map(p => (
                      <Link key={p.handle} href={`/community/user/${p.handle}`} style={{ textDecoration: "none" }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "8px 14px 8px 8px", borderRadius: "40px",
                          background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
                          transition: "border-color 0.15s",
                        }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                        >
                          <div style={{
                            width: "30px", height: "30px", borderRadius: "50%",
                            background: "#c0392b", overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "13px", fontWeight: 600, color: "#fff", flexShrink: 0,
                          }}>
                            {p.avatar_url
                              ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : (p.display_name || p.handle)[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", margin: 0 }}>
                              {p.display_name || p.handle}
                            </p>
                            <p style={{ fontSize: "11px", color: "#6b5452", margin: 0 }}>@{p.handle}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Score results */}
              <div style={{ marginBottom: "20px", display: "flex", alignItems: "baseline", gap: "10px" }}>
                <p style={{ fontSize: "13px", color: "#6b5452" }}>
                  {loading ? "Loading…" : `${filteredScores.length} score${filteredScores.length !== 1 ? "s" : ""}`}
                  {activeTag !== "All" && <span style={{ color: "#a89690", marginLeft: "6px" }}>in {activeTag}</span>}
                  {query && <span style={{ color: "#a89690", marginLeft: "6px" }}>for &ldquo;{query}&rdquo;</span>}
                </p>
                {isSearching && (
                  <button onClick={() => { setQuery(""); setActiveTag("All"); }}
                    style={{ fontSize: "12px", color: "#6b5452", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                    Clear
                  </button>
                )}
              </div>

              {loading ? (
                <p style={{ fontSize: "13px", color: "#6b5452" }}>Loading…</p>
              ) : filteredScores.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#fff", marginBottom: "8px" }}>No scores found</p>
                  <p style={{ fontSize: "13px", color: "#6b5452" }}>Try a different search or browse categories below.</p>
                </div>
              ) : (
                <div className="mob-2col tab-2col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  {filteredScores.map(s => <ScoreCard key={s.id} score={s} />)}
                </div>
              )}
            </div>

          ) : (
            /* ── HOMEPAGE VIEW ── */
            <>
              {/* Recently added */}
              <section style={{ marginBottom: "64px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#fff", marginBottom: "4px" }}>Recently added</h2>
                    <p style={{ fontSize: "13px", color: "#7a6360" }}>Fresh scores uploaded by the community.</p>
                  </div>
                </div>
                {loading ? (
                  <p style={{ fontSize: "13px", color: "#6b5452" }}>Loading…</p>
                ) : (
                  <div className="mob-2col tab-2col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                    {newScores.map(s => <ScoreCard key={s.id} score={s} />)}
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
                    { name: "Piano & Keyboard", slug: "piano", desc: "Solo piano, organ, harpsichord, and accompaniment scores.", image: "/categories/piano.png" },
                    { name: "Strings", slug: "strings", desc: "Violin, viola, cello, double bass, and string ensembles.", image: "/categories/strings-v2.png" },
                    { name: "Brass", slug: "brass", desc: "Trumpet, trombone, french horn, tuba, and brass ensembles.", image: "/categories/brass.png" },
                    { name: "Symphonic & Orchestral", slug: "symphonic", desc: "Full scores and parts for chamber and symphony orchestras.", image: "/categories/Symphomic.png" },
                    { name: "Guitar & Fretted", slug: "guitar", desc: "Classical guitar, acoustic, electric, and ukulele.", image: "/categories/guitar.png" },
                    { name: "Vocal & Choir", slug: "choir", desc: "Solo voice, art songs, opera, and choral arrangements.", image: "/categories/choir.png" },
                  ].map(cat => (
                    <Link key={cat.slug} href={`/community/category/${cat.slug}`} style={{ textDecoration: "none" }}>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "#1e1513", border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "12px", overflow: "hidden", cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                        onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.18)")}
                        onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)")}
                      >
                        <div style={{ padding: "16px 18px", flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: "Georgia, serif", fontSize: "15px", color: "#fff", marginBottom: "4px" }}>{cat.name}</p>
                          <p style={{ fontSize: "11px", color: "#7a6360", lineHeight: 1.5 }}>{cat.desc}</p>
                        </div>
                        <div style={{ width: "90px", minWidth: "90px", alignSelf: "stretch", position: "relative", flexShrink: 0 }}>
                          {cat.image && <Image src={cat.image} alt={cat.name} fill style={{ objectFit: "cover", objectPosition: "center" }} />}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Best of Piano */}
              <section style={{ marginBottom: "64px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#fff", marginBottom: "4px" }}>Best of Piano</h2>
                    <p style={{ fontSize: "13px", color: "#7a6360" }}>The most loved piano scores in the community.</p>
                  </div>
                  <Link href="/community/category/piano" style={{ fontSize: "13px", color: "#6b8fbd", textDecoration: "none", whiteSpace: "nowrap" }}>
                    Browse all →
                  </Link>
                </div>
                {loading ? (
                  <p style={{ fontSize: "13px", color: "#6b5452" }}>Loading…</p>
                ) : (
                  <div className="mob-2col tab-2col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                    {pianoScores.map(s => <ScoreCard key={s.id} score={s} />)}
                  </div>
                )}
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
                  <div className="mob-2col tab-2col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                    {brassScores.map(s => <ScoreCard key={s.id} score={s} />)}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
