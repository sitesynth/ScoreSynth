"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/community/AuthModal";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import type { Profile, Score } from "@/lib/supabase/types";

function ScoreCard({ score }: { score: Score }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/community/${score.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: "12px", overflow: "hidden", background: "#1e1513",
          border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
          transition: "all 0.2s ease", cursor: "pointer", display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ background: "#f5f0eb", aspectRatio: "4/3", position: "relative", overflow: "hidden" }}>
          <Image src="/scoreimagedefaultpreview.png" alt={score.title} fill style={{ objectFit: "cover" }} />
          {hovered && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(33,24,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#fff", padding: "8px 18px", borderRadius: "20px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)" }}>View score</span>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: "7px" }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{score.title}</p>
          <p style={{ fontSize: "11px", color: "#6b5452" }}>{score.composer}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b5452" }}>
                <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                {score.likes_count.toLocaleString()}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b5452" }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
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

export default function PublicUserProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState<Profile | null>(null);
  const [userScores, setUserScores] = useState<Score[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!handle) return;
    const supabase = createClient();

    async function load() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", handle)
        .single();

      if (!profileData) { setLoading(false); return; }
      setProfileUser(profileData as Profile);

      // User scores
      const { data: scoresData } = await supabase
        .from("scores")
        .select("id, title, composer, tag, price_display, likes_count, views_count, category, instruments, pages, publisher, description, difficulty, author_id, midi_url, pdf_url, created_at, updated_at")
        .eq("author_id", profileData.id)
        .order("likes_count", { ascending: false });
      setUserScores((scoresData as Score[]) ?? []);

      // Follower / following counts
      const { count: fCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("followee_id", profileData.id);
      setFollowerCount(fCount ?? 0);

      const { count: fgCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileData.id);
      setFollowingCount(fgCount ?? 0);

      setLoading(false);
    }

    load();
  }, [handle]);

  // Check if current user is following this profile
  useEffect(() => {
    if (!currentUser || !profileUser) return;
    const supabase = createClient();
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", currentUser.id)
      .eq("followee_id", profileUser.id)
      .single()
      .then(({ data }) => setIsFollowing(!!data));
  }, [currentUser, profileUser]);

  const handleFollow = async () => {
    if (!currentUser) { setShowAuthModal(true); return; }
    if (!profileUser) return;
    const supabase = createClient();
    if (isFollowing) {
      await supabase.from("follows").delete()
        .eq("follower_id", currentUser.id)
        .eq("followee_id", profileUser.id);
      setIsFollowing(false);
      setFollowerCount(c => Math.max(c - 1, 0));
    } else {
      await supabase.from("follows").insert({ follower_id: currentUser.id, followee_id: profileUser.id });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "80px", background: "#211817", minHeight: "100vh" }}>
        {loading ? (
          <div style={{ padding: "80px 32px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#6b5452" }}>Loading…</p>
          </div>
        ) : !profileUser ? (
          <div style={{ padding: "80px 32px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#6b5452", marginBottom: "12px" }}>User not found.</p>
            <Link href="/community" style={{ fontSize: "13px", color: "#6b8fbd", textDecoration: "none" }}>← Back to community</Link>
          </div>
        ) : (
          <>
            {/* Banner */}
            <div style={{ height: "160px", background: profileUser.banner_gradient }} />

            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px 80px" }}>
              {/* Avatar + Follow */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-40px", marginBottom: "20px" }}>
                <div style={{
                  width: "96px", height: "96px", borderRadius: "50%",
                  background: "#c0392b", border: "4px solid #211817",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "28px", fontWeight: 700, color: "#fff",
                  overflow: "hidden",
                }}>
                  {profileUser.avatar_url
                    ? <img src={profileUser.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (profileUser.display_name || profileUser.handle)[0].toUpperCase()}
                </div>
                <button
                  onClick={handleFollow}
                  style={{
                    padding: "8px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 500,
                    cursor: "pointer", transition: "all 0.15s",
                    background: isFollowing ? "none" : "#c0392b",
                    border: isFollowing ? "1px solid rgba(255,255,255,0.15)" : "none",
                    color: isFollowing ? "#a89690" : "#fff",
                  }}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>

              {/* Two-column */}
              <div style={{ display: "flex", gap: "48px" }}>
                {/* Left */}
                <div style={{ width: "220px", flexShrink: 0 }}>
                  <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#fff", marginBottom: "3px" }}>
                    {profileUser.display_name || profileUser.handle}
                  </h1>
                  <p style={{ fontSize: "13px", color: "#6b5452", marginBottom: "14px" }}>@{profileUser.handle}</p>
                  {profileUser.bio && <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.6, marginBottom: "14px" }}>{profileUser.bio}</p>}
                  <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
                    <span style={{ fontSize: "13px", color: "#a89690" }}><b style={{ color: "#e8dbd8" }}>{followerCount}</b> followers</span>
                    <span style={{ fontSize: "13px", color: "#a89690" }}><b style={{ color: "#e8dbd8" }}>{followingCount}</b> following</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {profileUser.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="13" height="13" fill="none" stroke="#6b5452" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span style={{ fontSize: "13px", color: "#a89690" }}>{profileUser.location}</span>
                      </div>
                    )}
                    {profileUser.website && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="13" height="13" fill="none" stroke="#6b5452" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                        <span style={{ fontSize: "13px", color: "#6b8fbd" }}>{profileUser.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: scores */}
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#a89690", marginBottom: "20px" }}>
                    Resources <span style={{ color: "#6b5452", fontWeight: 400 }}>({userScores.length})</span>
                  </h2>
                  {userScores.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                      {userScores.map(s => <ScoreCard key={s.id} score={s} />)}
                    </div>
                  ) : (
                    <p style={{ fontSize: "13px", color: "#6b5452" }}>No resources published yet.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />

      {showAuthModal && (
        <AuthModal
          intent="follow"
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => { setShowAuthModal(false); }}
        />
      )}
    </>
  );
}
