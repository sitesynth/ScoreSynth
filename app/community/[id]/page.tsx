"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/community/AuthModal";
import SaveButton from "@/components/community/SaveButton";
import EditScoreModal from "@/components/community/EditScoreModal";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import type { Score, Comment } from "@/lib/supabase/types";

// ─── Audio Player ─────────────────────────────────────────────────────────────
function AudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;
    setProgress(ratio * 100);
  };

  return (
    <div style={{
      borderRadius: "16px",
      background: "linear-gradient(135deg, #261a18 0%, #1e1513 100%)",
      border: "1px solid rgba(192,57,43,0.18)",
      padding: "18px 20px 16px",
      display: "flex", flexDirection: "column", gap: "14px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
          background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="13" height="13" fill="none" stroke="#c0392b" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#e8dbd8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </p>
          <p style={{ fontSize: "10px", color: "#6b5452", margin: "2px 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Audio Recording
          </p>
        </div>
        <span style={{ fontSize: "11px", color: "#6b5452", flexShrink: 0, fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>
          {fmt(current)} / {fmt(duration)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={e => {
          const a = e.currentTarget;
          setCurrent(a.currentTime);
          if (!dragging) setProgress((a.currentTime / a.duration) * 100 || 0);
        }}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrent(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Play/Pause */}
        <button
          onClick={toggle}
          style={{
            width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0,
            background: playing ? "#a93226" : "#c0392b",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: playing ? "0 0 0 6px rgba(192,57,43,0.15)" : "0 2px 12px rgba(192,57,43,0.4)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          {playing ? (
            <svg width="14" height="14" fill="#fff" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="14" height="14" fill="#fff" viewBox="0 0 24 24" style={{ marginLeft: "2px" }}>
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>

        {/* Progress bar */}
        <div style={{ flex: 1, position: "relative", cursor: "pointer", padding: "8px 0" }}
          ref={barRef}
          onClick={seek}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
        >
          {/* Track */}
          <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.08)" }}>
            {/* Fill */}
            <div style={{
              height: "100%", borderRadius: "2px",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #c0392b, #e74c3c)",
              transition: dragging ? "none" : "width 0.1s linear",
              position: "relative",
            }}>
              {/* Thumb */}
              <div style={{
                position: "absolute", right: "-5px", top: "50%",
                transform: "translateY(-50%)",
                width: "10px", height: "10px", borderRadius: "50%",
                background: "#e8dbd8",
                boxShadow: "0 0 0 2px rgba(192,57,43,0.5)",
                opacity: dragging || progress > 0 ? 1 : 0,
                transition: "opacity 0.15s",
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  // Set to true to enable comments when the main app is ready
  const COMMENTS_ENABLED = true;

  const [score, setScore] = useState<Score | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authIntent, setAuthIntent] = useState<"download" | "purchase">("download");
  const [loadingScore, setLoadingScore] = useState(true);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
        // Audio recording signed URL
        if (scoreData.midi_url) {
          const { data: audioData } = await supabase.storage
            .from("score-files")
            .createSignedUrl(scoreData.midi_url, 3600);
          if (audioData?.signedUrl) setAudioUrl(audioData.signedUrl);
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

  const handleDeleteComment = async (commentId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("author_id", user!.id);
    if (!error) setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleComment = async () => {
    if (!commentText.trim() || !user || !score) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .insert({ score_id: score.id, author_id: user.id, text: commentText.trim() })
      .select("*, profiles!comments_author_id_fkey(handle, display_name, avatar_url)")
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
        <div className="score-back-wrap" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 32px 0" }}>
          <button
            onClick={() => {
              const from = sessionStorage.getItem("scoreFrom");
              sessionStorage.removeItem("scoreFrom");
              if (from) router.push(from);
              else router.back();
            }}
            style={{ fontSize: "13px", color: "#7a6360", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", padding: 0 }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
        </div>

        <div className="score-detail-grid" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 32px 80px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "40px", alignItems: "start" }}>

          {/* Left — score preview + comments */}
          <div className="score-detail-left">
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
              <div className="score-pdf-preview" style={{ borderRadius: "16px", overflow: "hidden", background: "#1e1513", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "32px" }}>
                <p style={{ fontSize: "11px", color: "#6b5452", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Sheet music preview
                </p>
                <iframe
                  src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
                  className="score-pdf-iframe"
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
                            {user?.id === c.author_id && (
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                style={{ marginLeft: "4px", background: "none", border: "none", cursor: "pointer", color: "#6b5452", padding: 0, fontSize: "11px" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#e87060")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
                              >
                                delete
                              </button>
                            )}
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
          <div className="score-detail-sidebar" style={{ position: "sticky", top: "96px" }}>
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

            {/* Audio player in sidebar */}
            {audioUrl && (
              <div style={{ marginBottom: "16px" }}>
                <AudioPlayer src={audioUrl} title={score.title} />
              </div>
            )}


            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <SaveButton
                scoreId={id!}
                userId={user?.id ?? null}
                onRequireAuth={() => { setAuthIntent("download"); setShowAuthModal(true); }}
              />

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

              <button
                onClick={async () => {
                  const url = window.location.href;
                  if (navigator.share) {
                    try { await navigator.share({ title: score.title, text: score.composer ? `${score.title} — ${score.composer}` : score.title, url }); } catch { /* dismissed */ }
                  } else {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                style={{
                  width: "100%", padding: "11px", borderRadius: "10px",
                  background: copied ? "rgba(111,207,151,0.12)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${copied ? "rgba(111,207,151,0.35)" : "rgba(255,255,255,0.1)"}`,
                  color: copied ? "#6fcf97" : "#a89690", fontSize: "13px", fontWeight: 500,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  transition: "all 0.2s",
                }}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    Share
                  </>
                )}
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

                  {/* ── Instrument Parts ── */}
                  {score.parts && score.parts.length > 0 && (
                    <div style={{
                      marginTop: "4px", padding: "14px 16px", borderRadius: "12px",
                      background: "#1e1513", border: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <p style={{ fontSize: "12px", fontWeight: 500, color: "#e8dbd8", margin: 0 }}>
                          Instrument Parts
                          <span style={{
                            marginLeft: "7px", fontSize: "10px", padding: "2px 6px",
                            borderRadius: "4px", background: "rgba(107,143,189,0.15)",
                            color: "#6b8fbd", border: "1px solid rgba(107,143,189,0.25)",
                            fontWeight: 400,
                          }}>
                            {score.parts.length}
                          </span>
                        </p>
                        <button
                          onClick={async () => {
                            if (!isLoggedIn) { setAuthIntent("download"); setShowAuthModal(true); return; }
                            const supabase = createClient();
                            for (const part of score.parts) {
                              const { data } = await supabase.storage.from("score-files").createSignedUrl(part.pdf_url, 3600);
                              if (data?.signedUrl) {
                                const a = document.createElement("a");
                                a.href = data.signedUrl;
                                a.download = `${part.name}.pdf`;
                                a.click();
                                await new Promise(r => setTimeout(r, 400));
                              }
                            }
                          }}
                          style={{
                            fontSize: "11px", padding: "4px 10px", borderRadius: "6px",
                            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                            color: "#a89690", cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          Download all
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {score.parts.map((part, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
                              <svg width="12" height="12" fill="none" stroke="#6b5452" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                              </svg>
                              <span style={{ fontSize: "12px", color: "#a89690", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {part.name}
                              </span>
                            </div>
                            <button
                              onClick={async () => {
                                if (!isLoggedIn) { setAuthIntent("download"); setShowAuthModal(true); return; }
                                const supabase = createClient();
                                const { data } = await supabase.storage.from("score-files").createSignedUrl(part.pdf_url, 3600);
                                if (data?.signedUrl) {
                                  const a = document.createElement("a");
                                  a.href = data.signedUrl;
                                  a.download = `${part.name}.pdf`;
                                  a.click();
                                }
                              }}
                              style={{
                                flexShrink: 0, fontSize: "11px", padding: "3px 9px", borderRadius: "5px",
                                background: "none", border: "1px solid rgba(255,255,255,0.1)",
                                color: "#6b8fbd", cursor: "pointer",
                              }}
                            >
                              ↓ PDF
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

                  {/* Edit score — owner only */}
                  {user?.id === score.author_id && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      style={{
                        width: "100%", padding: "11px", borderRadius: "10px",
                        background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                        color: "#6b5452", fontSize: "13px", fontWeight: 500,
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: "6px", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(192,57,43,0.35)"; e.currentTarget.style.color = "#c0392b"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#6b5452"; }}
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit post
                    </button>
                  )}
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

      {showEditModal && (
        <EditScoreModal
          score={score}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => { setScore(updated); setShowEditModal(false); }}
        />
      )}
    </>
  );
}
