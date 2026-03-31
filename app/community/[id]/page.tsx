"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/community/AuthModal";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import type { Score, Comment } from "@/lib/supabase/types";

export default function ScoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  // Set to true to enable comments when the main app is ready
  const COMMENTS_ENABLED = false;

  const [score, setScore] = useState<Score | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authIntent, setAuthIntent] = useState<"download" | "purchase">("download");
  const [loadingScore, setLoadingScore] = useState(true);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();

    async function load() {
      // Fetch score with author profile
      const { data: scoreData } = await supabase
        .from("scores")
        .select("*, profiles!scores_author_id_fkey(handle, display_name, avatar_url)")
        .eq("id", id)
        .single();

      if (scoreData) {
        setScore(scoreData as Score);
        setLikeCount(scoreData.likes_count);
        // Generate signed URL for PDF preview
        if (scoreData.pdf_url) {
          const { data: signedData } = await supabase.storage
            .from("score-files")
            .createSignedUrl(scoreData.pdf_url, 3600);
          if (signedData?.signedUrl) setPdfPreviewUrl(signedData.signedUrl);
        }
      }
      setLoadingScore(false);

      // Fetch comments
      const { data: commentData } = await supabase
        .from("comments")
        .select("*, profiles!scores_author_id_fkey(handle, display_name, avatar_url)")
        .eq("score_id", id)
        .order("created_at", { ascending: false });

      setComments((commentData as Comment[]) ?? []);

      // Increment view count (fire and forget)
      supabase.rpc("increment_view", { score_id: id });
    }

    load();
  }, [id]);

  // Check if current user liked this score
  useEffect(() => {
    if (!user || !id) return;
    const supabase = createClient();
    supabase
      .from("likes")
      .select("user_id")
      .eq("score_id", id)
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setLiked(!!data));
  }, [user, id]);

  const handleLike = async () => {
    if (!user) { setAuthIntent("download"); setShowAuthModal(true); return; }
    const supabase = createClient();
    if (liked) {
      await supabase.from("likes").delete().eq("score_id", id).eq("user_id", user.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from("likes").insert({ score_id: id, user_id: user.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !user || !score) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .insert({ score_id: score.id, author_id: user.id, text: commentText.trim() })
      .select("*, profiles!scores_author_id_fkey(handle, display_name, avatar_url)")
      .single();
    if (data) setComments(prev => [data as Comment, ...prev]);
    setCommentText("");
  };

  if (loadingScore) {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: "120px", textAlign: "center", color: "#a89690" }}>
          <p>Loading…</p>
        </main>
      </>
    );
  }

  if (!score) {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: "120px", textAlign: "center", color: "#fff" }}>
          <p>Score not found.</p>
          <Link href="/community" style={{ color: "#6b8fbd" }}>← Back to community</Link>
        </main>
      </>
    );
  }

  const authorHandle = score.profiles?.handle ?? "";

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "80px", background: "#211817", minHeight: "100vh" }}>

        {/* Back link */}
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 32px 0" }}>
          <Link href="/community" style={{ fontSize: "13px", color: "#7a6360", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Community
          </Link>
        </div>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 32px 80px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "40px", alignItems: "start" }}>

          {/* Left — score preview + comments */}
          <div>
            {/* Cover image */}
            {score.cover_url && (
              <div style={{ borderRadius: "16px", overflow: "hidden", background: "#f5f0eb", marginBottom: "16px" }}>
                <Image
                  src={score.cover_url}
                  alt={score.title}
                  width={800} height={400}
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            )}

            {/* PDF Preview */}
            {pdfPreviewUrl && (
              <div style={{ borderRadius: "16px", overflow: "hidden", background: "#1e1513", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "32px" }}>
                <p style={{ fontSize: "11px", color: "#6b5452", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Sheet music preview
                </p>
                <iframe
                  src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
                  style={{ width: "100%", height: "600px", border: "none", background: "#fff" }}
                  title="Sheet music preview"
                />
              </div>
            )}

            {/* Fallback if no cover and no PDF preview */}
            {!score.cover_url && !pdfPreviewUrl && (
              <div style={{ borderRadius: "16px", overflow: "hidden", background: "#f5f0eb", marginBottom: "32px" }}>
                <Image
                  src="/scoreimagedefaultpreview.png"
                  alt={score.title}
                  width={800} height={600}
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            )}

            {/* Comments — hidden until main app is ready (flip COMMENTS_ENABLED to true to re-enable) */}
            {COMMENTS_ENABLED && (
              <div>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#fff", marginBottom: "20px" }}>
                  Comments ({comments.length})
                </h3>

                {/* Comment input */}
                {isLoggedIn ? (
                  <div style={{ marginBottom: "24px" }}>
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Write a comment…"
                      rows={3}
                      style={{
                        width: "100%", padding: "12px 16px", borderRadius: "10px",
                        background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff", fontSize: "14px", outline: "none", resize: "none",
                      }}
                    />
                    <button
                      onClick={handleComment}
                      style={{
                        marginTop: "8px", padding: "8px 20px", borderRadius: "8px",
                        background: "#fff", color: "#211817", fontSize: "13px",
                        fontWeight: 600, cursor: "pointer", border: "none",
                      }}
                    >
                      Post comment
                    </button>
                  </div>
                ) : (
                  <div style={{
                    marginBottom: "24px", padding: "16px 20px", borderRadius: "10px",
                    background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <p style={{ fontSize: "13px", color: "#a89690" }}>Sign in to leave a comment</p>
                    <button
                      onClick={() => { setAuthIntent("download"); setShowAuthModal(true); }}
                      style={{
                        padding: "7px 16px", borderRadius: "8px", background: "#fff",
                        color: "#211817", fontSize: "13px", fontWeight: 600,
                        cursor: "pointer", border: "none",
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                )}

                {/* Comment list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {comments.length === 0 && (
                    <p style={{ fontSize: "13px", color: "#6b5452" }}>No comments yet. Be the first!</p>
                  )}
                  {comments.map(c => {
                    const initials = (c.profiles?.display_name || c.profiles?.handle || "?")[0].toUpperCase();
                    const name = c.profiles?.display_name || c.profiles?.handle || "Unknown";
                    const time = new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                    return (
                      <div key={c.id} style={{ display: "flex", gap: "12px" }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                          background: "#c0392b", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "#fff",
                          overflow: "hidden",
                        }}>
                          {c.profiles?.avatar_url
                            ? <img src={c.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "baseline", marginBottom: "4px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8" }}>{name}</span>
                            <span style={{ fontSize: "11px", color: "#6b5452" }}>{time}</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.5 }}>{c.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ position: "sticky", top: "96px" }}>
            {/* Tag */}
            <span style={{
              fontSize: "11px", padding: "3px 10px", borderRadius: "4px",
              background: "rgba(255,255,255,0.06)", color: "#a89690",
              display: "inline-block", marginBottom: "12px",
            }}>
              {score.tag === "premium" ? score.price_display : "Free"}
            </span>

            {/* Title */}
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#fff", lineHeight: 1.2, marginBottom: "4px" }}>
              {score.title}
            </h1>
            <p style={{ fontSize: "14px", color: "#a89690", marginBottom: "8px" }}>
              {score.composer}
            </p>
            <Link
              href={`/community/user/${authorHandle}`}
              style={{ fontSize: "12px", color: "#6b5452", textDecoration: "none", marginBottom: "20px", display: "inline-block", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#a89690")}
              onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
            >
              @{authorHandle}
            </Link>

            {/* Stats */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#a89690" }}>
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {likeCount.toLocaleString()}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#a89690" }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
                {score.views_count.toLocaleString()}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#a89690" }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {comments.length}
              </span>
            </div>

            {/* Description */}
            <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.6, marginBottom: "24px" }}>
              {score.description}
            </p>

            {/* Meta */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px", padding: "16px", borderRadius: "10px", background: "#1e1513", border: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                { label: "Publisher", value: score.publisher },
                { label: "Difficulty", value: score.difficulty },
                { label: "Pages", value: String(score.pages) },
                { label: "Instruments", value: score.instruments.join(", ") },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#6b5452", flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: "12px", color: "#e8dbd8", textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={handleLike}
                style={{
                  width: "100%", padding: "11px", borderRadius: "10px",
                  background: liked ? "rgba(192,57,43,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${liked ? "rgba(192,57,43,0.4)" : "rgba(255,255,255,0.1)"}`,
                  color: liked ? "#c0392b" : "#a89690", fontSize: "13px", fontWeight: 500,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  transition: "all 0.15s",
                }}
              >
                <svg width="14" height="14" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {liked ? "Liked" : "Like"}
              </button>

              {score.tag === "premium" ? (
                <button
                  onClick={() => {
                    if (!isLoggedIn) { setAuthIntent("purchase"); setShowAuthModal(true); }
                  }}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "10px",
                    background: "#e8dbd8", color: "#211817", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", border: "none", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "8px", transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Buy for {score.price_display}
                </button>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      if (!isLoggedIn) { setAuthIntent("download"); setShowAuthModal(true); return; }
                      if (!score.pdf_url) return;
                      const supabase = createClient();
                      const { data } = await supabase.storage.from("score-files").createSignedUrl(score.pdf_url, 3600);
                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                    }}
                    style={{
                      width: "100%", padding: "11px", borderRadius: "10px",
                      background: "#fff", color: "#211817", fontSize: "13px", fontWeight: 600,
                      cursor: "pointer", border: "none", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: "6px", transition: "opacity 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PDF
                  </button>

                  <Link href="/app" style={{
                    width: "100%", padding: "11px", borderRadius: "10px",
                    background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#a89690", fontSize: "13px", fontWeight: 500,
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "6px", textDecoration: "none",
                  }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Open in Editor
                  </Link>
                </>
              )}
            </div>
          </div>

        </div>
      </main>
      <Footer />

      {showAuthModal && (
        <AuthModal
          intent={authIntent}
          scoreTitle={score.title}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}
