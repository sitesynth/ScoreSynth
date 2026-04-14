"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/community/AuthModal";
import UploadScoreModal from "@/components/community/UploadScoreModal";
import EditScoreModal from "@/components/community/EditScoreModal";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import type { Profile, Score } from "@/lib/supabase/types";
import AvatarCropper from "@/components/community/AvatarCropper";

// ─── Inline editable field (owner only) ────────────────────────────────────
function InlineField({
  value, onChange, placeholder, multiline, maxLength, style,
}: {
  value: string; onChange: (v: string) => void;
  placeholder: string; multiline?: boolean; maxLength?: number; style?: React.CSSProperties;
}) {
  const [focused, setFocused] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = taRef.current.scrollHeight + "px";
  }, [value]);

  const base: React.CSSProperties = {
    background: "none", border: "none", outline: "none",
    color: value ? "#e8dbd8" : "#3d2a28",
    fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit",
    lineHeight: "inherit", width: "100%", padding: "2px 0",
    cursor: "text", resize: "none",
    borderBottom: focused ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
    transition: "border-color 0.15s",
    ...style,
  };
  if (multiline) return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={taRef}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={1}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...base, display: "block", overflow: "hidden" }}
      />
      {focused && maxLength && (
        <span style={{ fontSize: "10px", color: "#3d2a28", position: "absolute", bottom: "-16px", right: 0 }}>
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
  return (
    <input type="text" value={value} placeholder={placeholder}
      maxLength={maxLength}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={base} />
  );
}

// ─── Score card ─────────────────────────────────────────────────────────────
function ScoreCard({ score, isOwner, onEdit }: {
  score: Score; isOwner?: boolean; onEdit?: (s: Score) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  return (
    <div onClick={() => router.push(`/community/${score.id}`)} style={{ cursor: "pointer", minWidth: 0 }}>
      <div
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: "12px", overflow: "hidden", background: "#1e1513",
          border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
          transition: "all 0.2s ease", display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ position: "relative", paddingBottom: "75%", overflow: "hidden", background: "#f5f0eb" }}>
          {score.cover_url
            ? <Image src={score.cover_url} alt={score.title} fill style={{ objectFit: "contain" }} />
            : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
              </div>
          }
          {hovered && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(33,24,23,0.55)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#fff", padding: "7px 16px", borderRadius: "20px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)" }}>View</span>
              {isOwner && onEdit && (
                <span onClick={e => { e.stopPropagation(); onEdit(score); }}
                  style={{ fontSize: "13px", fontWeight: 500, color: "#fff", padding: "7px 16px", borderRadius: "20px", background: "rgba(192,57,43,0.7)", backdropFilter: "blur(6px)", border: "1px solid rgba(192,57,43,0.5)", cursor: "pointer" }}>
                  Edit
                </span>
              )}
            </div>
          )}
        </div>
        <div style={{ padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: "3px" }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{score.title}</p>
          <p style={{ fontSize: "11px", color: "#6b5452" }}>{score.composer || "—"}</p>
          {score.instruments && (score.instruments as string[]).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "5px" }}>
              {(score.instruments as string[]).slice(0, 3).map(inst => (
                <span
                  key={inst}
                  onClick={e => { e.stopPropagation(); router.push(`/community?q=${encodeURIComponent(inst)}`); }}
                  style={{
                    fontSize: "10px", padding: "2px 7px", borderRadius: "20px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#a89690", cursor: "pointer", whiteSpace: "nowrap",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#e8dbd8"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#a89690"; }}
                >
                  {inst}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
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
    </div>
  );
}

// ─── Collection card (Pinterest style) ──────────────────────────────────────
type Collection = { id: string; name: string; count: number; covers: (string | null)[] };

function CollectionCard({ coll, onClick }: { coll: Collection; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const covers = coll.covers.slice(0, 4);
  while (covers.length < 4) covers.push(null);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "12px", overflow: "hidden", background: "#1e1513",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 6px 24px rgba(0,0,0,0.4)" : "none",
        transition: "all 0.2s ease", cursor: "pointer",
      }}
    >
      {/* 2×2 cover grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", aspectRatio: "1/1" }}>
        {covers.map((src, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden", background: "#1a1210" }}>
            {src
              ? <Image src={src} alt="" fill style={{ objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
            }
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 12px" }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", marginBottom: "2px" }}>{coll.name}</p>
        <p style={{ fontSize: "11px", color: "#6b5452" }}>{coll.count} {coll.count === 1 ? "score" : "scores"}</p>
      </div>
    </div>
  );
}

// ─── Banner gradients ────────────────────────────────────────────────────────
const BANNER_GRADIENTS = [
  "linear-gradient(135deg, #7a2318 0%, #c0392b 60%, #8b2c1e 100%)",
  "linear-gradient(135deg, #1a3a5c 0%, #2563eb 60%, #1e3a8a 100%)",
  "linear-gradient(135deg, #1a4a2e 0%, #16a34a 60%, #14532d 100%)",
  "linear-gradient(135deg, #3b1f5e 0%, #7c3aed 60%, #4c1d95 100%)",
  "linear-gradient(135deg, #4a3000 0%, #d97706 60%, #92400e 100%)",
  "linear-gradient(135deg, #1e3040 0%, #0e7490 60%, #164e63 100%)",
];

// ─── Main page ───────────────────────────────────────────────────────────────
export default function PublicUserProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [profileUser, setProfileUser] = useState<Profile | null>(null);
  const [userScores, setUserScores] = useState<Score[]>([]);
  const [savedScores, setSavedScores] = useState<Score[]>([]);
  const [savedCollectionIds, setSavedCollectionIds] = useState<(string | null)[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | "all" | null>(null); // null = overview
  const [activeTab, setActiveTab] = useState<"resources" | "saved">("resources");
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingScore, setEditingScore] = useState<Score | null>(null);

  // Inline edit state (owner only)
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerGradient, setBannerGradient] = useState(BANNER_GRADIENTS[0]);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [profileDirty, setProfileDirty] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [newCollName, setNewCollName] = useState("");
  const [addingColl, setAddingColl] = useState(false);

  // Mark profile dirty whenever edit fields change (but not on initial load)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) return;
    setProfileDirty(true);
  }, [displayName, bio, location, website, twitter, instagram]);

  useEffect(() => {
    if (!handle) return;
    const supabase = createClient();

    async function load() {
      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("handle", handle).single();
      if (!profileData) { setLoading(false); return; }
      const p = profileData as Profile;
      setProfileUser(p);
      setDisplayName(p.display_name ?? "");
      setBio(p.bio ?? "");
      setLocation(p.location ?? "");
      setWebsite(p.website ?? "");
      setTwitter(p.twitter ?? "");
      setInstagram(p.instagram ?? "");
      setAvatarUrl(p.avatar_url ?? null);
      setBannerGradient(p.banner_gradient ?? BANNER_GRADIENTS[0]);
      setBannerImageUrl((p as Profile & { banner_url?: string }).banner_url ?? null);
      initializedRef.current = true;

      const [scoresRes, savedRes, fCountRes, fgCountRes] = await Promise.all([
        supabase.from("scores")
          .select("id, title, composer, tag, price_display, likes_count, views_count, category, instruments, pages, publisher, description, difficulty, author_id, midi_url, pdf_url, created_at, updated_at, cover_url")
          .eq("author_id", p.id).order("likes_count", { ascending: false }),
        supabase.from("saved_scores")
          .select("collection_id, scores(id, title, composer, tag, price_display, likes_count, views_count, category, cover_url, author_id, pdf_url, midi_url, instruments, pages, publisher, description, difficulty, created_at, updated_at)")
          .eq("user_id", p.id).order("saved_at", { ascending: false }),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", p.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", p.id),
      ]);

      setUserScores((scoresRes.data as Score[]) ?? []);

      const savedRows = (savedRes.data ?? []) as unknown as { collection_id: string | null; scores: Score }[];
      const scores = savedRows.map(r => r.scores).filter(Boolean);
      const collIds = savedRows.map(r => r.collection_id);
      setSavedScores(scores);
      setSavedCollectionIds(collIds);

      setFollowerCount(fCountRes.count ?? 0);
      setFollowingCount(fgCountRes.count ?? 0);

      // Load collections
      const { data: collData } = await supabase.from("collections")
        .select("id, name").eq("user_id", p.id).order("created_at");
      const rawColls = (collData ?? []) as { id: string; name: string }[];

      // Build collection objects with count + covers
      const colls: Collection[] = rawColls.map(c => {
        const idxs = collIds.map((cid, i) => cid === c.id ? i : -1).filter(i => i >= 0);
        return {
          id: c.id,
          name: c.name,
          count: idxs.length,
          covers: idxs.slice(0, 4).map(i => scores[i]?.cover_url ?? null),
        };
      });
      setCollections(colls);

      setLoading(false);
    }
    load();
  }, [handle]);

  // Follow state
  useEffect(() => {
    if (!currentUser || !profileUser) return;
    const supabase = createClient();
    supabase.from("follows").select("follower_id")
      .eq("follower_id", currentUser.id).eq("followee_id", profileUser.id).single()
      .then(({ data }) => setIsFollowing(!!data));
  }, [currentUser, profileUser]);

  const isOwner = !!(currentUser && profileUser && currentUser.id === profileUser.id);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleFollow = async () => {
    if (!currentUser) { setShowAuthModal(true); return; }
    if (!profileUser) return;
    const supabase = createClient();
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("followee_id", profileUser.id);
      setIsFollowing(false); setFollowerCount(c => Math.max(c - 1, 0));
    } else {
      await supabase.from("follows").insert({ follower_id: currentUser.id, followee_id: profileUser.id });
      setIsFollowing(true); setFollowerCount(c => c + 1);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setSavingProfile(true);
    const supabase = createClient();
    const updates = {
      display_name: displayName.trim() || profileUser?.handle,
      bio: bio.trim(), location: location.trim(),
      website: website.trim(), twitter: twitter.trim(), instagram: instagram.trim(),
      banner_gradient: bannerGradient,
      banner_url: bannerImageUrl,
    };
    const { data } = await supabase.from("profiles").update(updates).eq("id", currentUser.id).select().single();
    if (data) setProfileUser(data as Profile);
    setSavingProfile(false);
    setProfileDirty(false);
  };

  const handleBannerUpload = async (file: File) => {
    if (!currentUser) return;
    const ext = file.name.split(".").pop();
    const path = `${currentUser.id}/banner.${ext}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    setBannerImageUrl(url);
    setProfileDirty(true);
    setShowBannerPicker(false);
  };

  const handleAvatarUpload = async (file: File) => {
    // Show cropper first
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!currentUser) return;
    setCropSrc(null);
    const path = `${currentUser.id}/avatar.jpg`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (error) return;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(url);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", currentUser.id);
  };

  const handleCreateCollection = async () => {
    if (!newCollName.trim() || !currentUser) return;
    setAddingColl(true);
    const supabase = createClient();
    const { data } = await supabase.from("collections")
      .insert({ user_id: currentUser.id, name: newCollName.trim() })
      .select("id, name").single();
    if (data) {
      setCollections(prev => [...prev, { id: data.id, name: data.name, count: 0, covers: [] }]);
      setNewCollName("");
    }
    setAddingColl(false);
  };

  // ─── Saved tab view ──────────────────────────────────────────────────────
  // null = collection grid, "all" = all saved, string = specific collection
  const visibleSaved = activeCollection === null ? [] :
    activeCollection === "all"
      ? savedScores
      : savedScores.filter((_, i) => savedCollectionIds[i] === activeCollection);

  const unsortedSaved = savedScores.filter((_, i) => savedCollectionIds[i] === null);

  // ─── Render ──────────────────────────────────────────────────────────────
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
            <div style={{
              position: "relative", height: "160px",
              background: bannerImageUrl ? "none" : bannerGradient,
              backgroundImage: bannerImageUrl ? `url(${bannerImageUrl})` : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
            }}>
              {isOwner && (
                <>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); }}
                  />
                  <button
                    onClick={() => setShowBannerPicker(v => !v)}
                    style={{
                      position: "absolute", bottom: "12px", right: "16px",
                      fontSize: "11px", color: "rgba(255,255,255,0.7)",
                      background: "rgba(0,0,0,0.3)", padding: "4px 10px",
                      borderRadius: "6px", backdropFilter: "blur(4px)",
                      border: "none", cursor: "pointer",
                    }}
                  >
                    Edit banner
                  </button>
                  {showBannerPicker && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: "absolute", bottom: "-72px", right: "16px", zIndex: 20,
                        background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "10px", padding: "10px 12px",
                        display: "flex", alignItems: "center", gap: "8px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                      }}
                    >
                      {/* Gradient swatches */}
                      {BANNER_GRADIENTS.map((g, i) => (
                        <div key={i}
                          onClick={() => { setBannerGradient(g); setBannerImageUrl(null); setShowBannerPicker(false); setProfileDirty(true); }}
                          style={{
                            width: "28px", height: "28px", borderRadius: "6px", background: g,
                            cursor: "pointer",
                            border: !bannerImageUrl && bannerGradient === g ? "2px solid #fff" : "2px solid transparent",
                            transition: "border-color 0.15s",
                          }}
                        />
                      ))}
                      {/* Divider */}
                      <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />
                      {/* Upload photo button */}
                      <button
                        onClick={() => bannerInputRef.current?.click()}
                        style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          padding: "5px 10px", borderRadius: "6px",
                          background: bannerImageUrl ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                          border: bannerImageUrl ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.8)", fontSize: "11px", cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        {bannerImageUrl ? "Change photo" : "Upload photo"}
                      </button>
                      {bannerImageUrl && (
                        <button
                          onClick={() => { setBannerImageUrl(null); setProfileDirty(true); setShowBannerPicker(false); }}
                          style={{
                            padding: "5px 8px", borderRadius: "6px",
                            background: "rgba(192,57,43,0.2)", border: "1px solid rgba(192,57,43,0.3)",
                            color: "#c0392b", fontSize: "11px", cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px 80px" }}>
              {/* Avatar + actions row */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-48px", marginBottom: "20px" }}>
                {/* Avatar */}
                <div style={{ position: "relative" }}>
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
                  <div
                    onClick={() => isOwner && avatarInputRef.current?.click()}
                    onMouseEnter={() => setAvatarHover(true)}
                    onMouseLeave={() => setAvatarHover(false)}
                    style={{
                      width: "96px", height: "96px", borderRadius: "50%",
                      background: "#c0392b", border: "4px solid #211817",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "28px", fontWeight: 700, color: "#fff",
                      overflow: "hidden", cursor: isOwner ? "pointer" : "default",
                      position: "relative",
                    }}
                  >
                    {avatarUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (displayName || profileUser.handle)[0]?.toUpperCase()}
                    {isOwner && avatarHover && (
                      <div style={{
                        position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px",
                      }}>
                        <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span style={{ fontSize: "9px", color: "#fff", fontWeight: 500 }}>Change</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {isOwner ? (
                    <>
                      {profileDirty && (
                        <button
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          style={{
                            padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                            cursor: "pointer", background: "#fff", color: "#211817", border: "none",
                            opacity: savingProfile ? 0.7 : 1,
                          }}
                        >
                          {savingProfile ? "Saving…" : "Save profile"}
                        </button>
                      )}
                      <button
                        onClick={() => setShowUploadModal(true)}
                        style={{
                          padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                          cursor: "pointer", background: "#c0392b", border: "none", color: "#fff",
                          display: "flex", alignItems: "center", gap: "7px",
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Upload score
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          if (!currentUser) { setShowAuthModal(true); return; }
                          router.push(`/community/messages?with=${profileUser.handle}`);
                        }}
                        style={{
                          padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                          cursor: "pointer", background: "none", border: "1px solid rgba(255,255,255,0.15)",
                          color: "#a89690", display: "flex", alignItems: "center", gap: "6px",
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        Message
                      </button>
                      <button
                        onClick={handleFollow}
                        style={{
                          padding: "8px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 500,
                          cursor: "pointer",
                          background: isFollowing ? "none" : "#c0392b",
                          border: isFollowing ? "1px solid rgba(255,255,255,0.15)" : "none",
                          color: isFollowing ? "#a89690" : "#fff",
                        }}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Two-column layout */}
              <div style={{ display: "flex", gap: "48px" }}>
                {/* Left sidebar */}
                <div style={{ width: "220px", flexShrink: 0 }}>
                  {isOwner ? (
                    <>
                      <div style={{ marginBottom: "2px" }}>
                        <InlineField value={displayName} onChange={setDisplayName}
                          placeholder="Your name"
                          style={{ fontSize: "22px", fontWeight: 600, color: "#fff" }} />
                      </div>
                      <p style={{ fontSize: "13px", color: "#6b5452", marginBottom: "14px" }}>@{profileUser.handle}</p>
                      <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
                        <span style={{ fontSize: "13px", color: "#a89690" }}><b style={{ color: "#e8dbd8" }}>{followerCount}</b> followers</span>
                        <span style={{ fontSize: "13px", color: "#a89690" }}><b style={{ color: "#e8dbd8" }}>{followingCount}</b> following</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                        {[
                          { val: bio, set: setBio, ph: "Add a bio…", icon: "M4 6h16M4 12h16M4 18h7", multi: true, maxLen: 300 },
                          { val: location, set: setLocation, ph: "Add location", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a3 3 0 110-6 3 3 0 010 6z" },
                          { val: website, set: setWebsite, ph: "Add website URL", icon: "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0c-2.8 2.7-4 6-4 10s1.2 7.3 4 10m0-20c2.8 2.7 4 6 4 10s-1.2 7.3-4 10M2 12h20" },
                          { val: twitter, set: setTwitter, ph: "X / Twitter handle", icon: "M4 4l16 16M4 20L20 4" },
                          { val: instagram, set: setInstagram, ph: "Instagram handle", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" },
                        ].map(({ val, set, ph, icon, multi, maxLen }) => (
                          <div key={ph} style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                            <svg width="13" height="13" fill="none" stroke="#3d2a28" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: "4px" }}>
                              <path d={icon} />
                            </svg>
                            <InlineField value={val} onChange={set} placeholder={ph} multiline={multi} maxLength={maxLen}
                              style={{ fontSize: "13px", color: val ? "#a89690" : "#3d2a28" }} />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
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
                            <a href={profileUser.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#6b8fbd", textDecoration: "none" }}>{profileUser.website.replace(/^https?:\/\//, "")}</a>
                          </div>
                        )}
                        {profileUser.twitter && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#6b5452"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.845L1.254 2.25H8.08l4.261 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            <a href={`https://x.com/${profileUser.twitter.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#6b8fbd", textDecoration: "none" }}>@{profileUser.twitter.replace(/^@/, "")}</a>
                          </div>
                        )}
                        {profileUser.instagram && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <svg width="13" height="13" fill="none" stroke="#6b5452" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="#6b5452"/></svg>
                            <a href={`https://instagram.com/${profileUser.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#6b8fbd", textDecoration: "none" }}>@{profileUser.instagram.replace(/^@/, "")}</a>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Right: tabs + content */}
                <div style={{ flex: 1 }}>
                  {/* Tabs */}
                  <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {([
                      { key: "resources", label: "Resources", count: userScores.length },
                      { key: "saved", label: "Saved", count: savedScores.length },
                    ] as const).map(tab => (
                      <button key={tab.key} onClick={() => { setActiveTab(tab.key); setActiveCollection(null); }}
                        style={{
                          padding: "8px 16px", fontSize: "13px", fontWeight: 500,
                          cursor: "pointer", background: "none", border: "none",
                          borderBottom: activeTab === tab.key ? "2px solid #fff" : "2px solid transparent",
                          color: activeTab === tab.key ? "#fff" : "#6b5452",
                          marginBottom: "-1px", transition: "color 0.15s",
                        }}
                      >
                        {tab.label}
                        <span style={{ marginLeft: "6px", fontSize: "11px", color: activeTab === tab.key ? "#a89690" : "#3d2d2b" }}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Resources tab */}
                  {activeTab === "resources" && (
                    userScores.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                        {userScores.map(s => (
                          <ScoreCard key={s.id} score={s} isOwner={isOwner} onEdit={setEditingScore} />
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: "#6b5452" }}>No resources published yet.</p>
                    )
                  )}

                  {/* Saved tab */}
                  {activeTab === "saved" && (
                    <div>
                      {/* Sub-navigation when a collection is open */}
                      {activeCollection !== null && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                          <button onClick={() => setActiveCollection(null)}
                            style={{ fontSize: "13px", color: "#6b5452", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                            Collections
                          </button>
                          <span style={{ fontSize: "13px", color: "#6b5452" }}>/</span>
                          <span style={{ fontSize: "13px", color: "#e8dbd8" }}>
                            {activeCollection === "all" ? "All saved" : collections.find(c => c.id === activeCollection)?.name}
                          </span>
                        </div>
                      )}

                      {/* Collection overview */}
                      {activeCollection === null && (
                        <>
                          {savedScores.length === 0 ? (
                            <p style={{ fontSize: "13px", color: "#6b5452" }}>No saved scores yet.</p>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                              {/* "All saved" card */}
                              <CollectionCard
                                coll={{ id: "all", name: "All saved", count: savedScores.length, covers: savedScores.slice(0, 4).map(s => s.cover_url ?? null) }}
                                onClick={() => setActiveCollection("all")}
                              />
                              {/* Named collections */}
                              {collections.filter(c => c.count > 0).map(c => (
                                <CollectionCard key={c.id} coll={c} onClick={() => setActiveCollection(c.id)} />
                              ))}
                              {/* Unsorted (if any scores not in a collection) */}
                              {unsortedSaved.length > 0 && collections.length > 0 && (
                                <CollectionCard
                                  coll={{ id: "unsorted", name: "Unsorted", count: unsortedSaved.length, covers: unsortedSaved.slice(0, 4).map(s => s.cover_url ?? null) }}
                                  onClick={() => setActiveCollection(null)}
                                />
                              )}
                            </div>
                          )}

                          {/* Create collection (owner) */}
                          {isOwner && (
                            <div style={{ marginTop: "20px", display: "flex", gap: "8px", maxWidth: "340px" }}>
                              <input
                                type="text"
                                placeholder="New collection name…"
                                value={newCollName}
                                onChange={e => setNewCollName(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleCreateCollection(); }}
                                style={{
                                  flex: 1, padding: "8px 12px", borderRadius: "8px",
                                  background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
                                  color: "#fff", fontSize: "13px", outline: "none",
                                }}
                              />
                              <button
                                onClick={handleCreateCollection}
                                disabled={!newCollName.trim() || addingColl}
                                style={{
                                  padding: "8px 16px", borderRadius: "8px", background: "#fff",
                                  color: "#211817", fontSize: "13px", fontWeight: 600,
                                  border: "none", cursor: "pointer",
                                }}
                              >
                                + Create
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* Scores inside a collection */}
                      {activeCollection !== null && (
                        visibleSaved.length > 0 ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                            {visibleSaved.map(s => <ScoreCard key={s.id} score={s} />)}
                          </div>
                        ) : (
                          <p style={{ fontSize: "13px", color: "#6b5452" }}>No scores in this collection yet.</p>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />

      {showAuthModal && (
        <AuthModal intent="follow" onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
      )}
      {showUploadModal && (
        <UploadScoreModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            if (!handle || !profileUser) return;
            const supabase = createClient();
            supabase.from("scores")
              .select("id, title, composer, tag, price_display, likes_count, views_count, category, instruments, pages, publisher, description, difficulty, author_id, midi_url, pdf_url, created_at, updated_at, cover_url")
              .eq("author_id", profileUser.id).order("likes_count", { ascending: false })
              .then(({ data }) => setUserScores((data as Score[]) ?? []));
          }}
        />
      )}
      {editingScore && (
        <EditScoreModal
          score={editingScore}
          onClose={() => setEditingScore(null)}
          onSuccess={updated => {
            setUserScores(prev => prev.map(s => s.id === updated.id ? updated : s));
            setEditingScore(null);
          }}
        />
      )}
      {cropSrc && (
        <AvatarCropper
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropSrc(null); if (avatarInputRef.current) avatarInputRef.current.value = ""; }}
        />
      )}
    </>
  );
}
