"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ALL_SCORES, Comment } from "@/lib/scores";

export default function ScoreDetailPage() {
  const { id } = useParams();
  const score = ALL_SCORES.find(s => s.id === Number(id));

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(score?.likes ?? 0);
  const [comments, setComments] = useState<Comment[]>(score?.comments ?? []);
  const [commentText, setCommentText] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authIntent, setAuthIntent] = useState<"download" | "purchase">("download");
  // Mock: not logged in
  const [isLoggedIn] = useState(false);

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

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: Date.now(),
      author: "You",
      avatar: "Y",
      text: commentText.trim(),
      time: "just now",
      likes: 0,
    };
    setComments(prev => [newComment, ...prev]);
    setCommentText("");
  };

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
            {/* Score image */}
            <div style={{ borderRadius: "16px", overflow: "hidden", background: "#f5f0eb", marginBottom: "32px" }}>
              <Image
                src="/scoreimagedefaultpreview.png"
                alt={score.title}
                width={800} height={600}
                style={{ width: "100%", height: "auto" }}
              />
            </div>

            {/* Comments */}
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
                  <Link href="/app" style={{
                    padding: "7px 16px", borderRadius: "8px", background: "#fff",
                    color: "#211817", fontSize: "13px", fontWeight: 600, textDecoration: "none",
                  }}>
                    Sign in
                  </Link>
                </div>
              )}

              {/* Comment list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {comments.length === 0 && (
                  <p style={{ fontSize: "13px", color: "#6b5452" }}>No comments yet. Be the first!</p>
                )}
                {comments.map(c => (
                  <div key={c.id} style={{ display: "flex", gap: "12px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                      background: "#c0392b", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "#fff",
                    }}>
                      {c.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "baseline", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8" }}>{c.author}</span>
                        <span style={{ fontSize: "11px", color: "#6b5452" }}>{c.time}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.5 }}>{c.text}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                        <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b5452", padding: 0 }}>
                          <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          {c.likes}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar — details */}
          <div style={{ position: "sticky", top: "96px" }}>
            {/* Tag */}
            <span style={{
              fontSize: "11px", padding: "3px 10px", borderRadius: "4px",
              background: "rgba(255,255,255,0.06)",
              color: "#a89690",
              display: "inline-block", marginBottom: "12px",
            }}>
              {score.tag === "premium" ? score.price : "Free"}
            </span>

            {/* Title */}
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#fff", lineHeight: 1.2, marginBottom: "4px" }}>
              {score.title}
            </h1>
            <p style={{ fontSize: "14px", color: "#a89690", marginBottom: "8px" }}>
              {score.composer}
            </p>
            <Link
              href={`/community/user/${score.author}`}
              style={{ fontSize: "12px", color: "#6b5452", textDecoration: "none", marginBottom: "20px", display: "inline-block", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#a89690")}
              onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
            >
              @{score.author}
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
                {score.views.toLocaleString()}
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
                    if (!isLoggedIn) {
                      setAuthIntent("purchase");
                      setShowAuthModal(true);
                    }
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
                  Buy for {score.price}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (!isLoggedIn) {
                        setAuthIntent("download");
                        setShowAuthModal(true);
                      }
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

      {/* Auth modal */}
      {showAuthModal && (
        <div
          onClick={() => setShowAuthModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#2a1f1e", borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "36px 32px", width: "100%", maxWidth: "360px",
              display: "flex", flexDirection: "column", gap: "16px",
            }}
          >
            {/* Close */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#fff", fontWeight: 400 }}>
                {authIntent === "purchase" ? "Sign in to purchase" : "Sign in to download"}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{ color: "#6b5452", fontSize: "20px", lineHeight: 1, padding: "4px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.5, marginBottom: "4px" }}>
              {authIntent === "purchase" ? (
                <>
                  Create a free account or sign in to purchase <em style={{ color: "#e8dbd8" }}>{score.title}</em>.
                </>
              ) : (
                <>
                  Create a free account or sign in to download <em style={{ color: "#e8dbd8" }}>{score.title}</em>.
                </>
              )}
            </p>

            {/* Google */}
            <button style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              width: "100%", padding: "12px 16px", borderRadius: "10px",
              background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer",
              transition: "opacity 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: "12px", color: "#6b5452" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Email CTA */}
            <Link
              href="/app"
              style={{
                display: "block", width: "100%", textAlign: "center",
                padding: "12px 16px", borderRadius: "10px",
                background: "#fff", color: "#211817",
                fontSize: "13px", fontWeight: 600, textDecoration: "none",
                transition: "opacity 0.15s", boxSizing: "border-box",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Sign up with email
            </Link>

            <p style={{ fontSize: "11px", color: "#6b5452", textAlign: "center" }}>
              Already have an account?{" "}
              <Link href="/app" style={{ color: "#a89690", textDecoration: "underline" }}>Sign in</Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
