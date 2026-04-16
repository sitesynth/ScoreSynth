"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import ScoreCard from "@/components/community/ScoreCard";
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
import CoverCropper from "@/components/community/CoverCropper";
import MessageModal from "@/components/community/MessageModal";

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

// ─── Collection card (Pinterest style) ──────────────────────────────────────
type Collection = { id: string; name: string; count: number; covers: (string | null)[]; parent_id: string | null; cover_url?: string | null };

function CollectionCard({ coll, onClick, isOwner, onDelete, onRename, onCoverChange }: {
  coll: Collection;
  onClick: () => void;
  isOwner?: boolean;
  onDelete?: () => void;
  onRename?: (newName: string) => void;
  onCoverChange?: (file: File) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(coll.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const covers = coll.covers.slice(0, 4);
  while (covers.length < 4) covers.push(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: "relative" }}
    >
      <div
        onClick={onClick}
        style={{
          borderRadius: "12px", overflow: "hidden", background: "#1e1513",
          border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          boxShadow: hovered ? "0 6px 24px rgba(0,0,0,0.4)" : "none",
          transition: "all 0.2s ease", cursor: "pointer",
        }}
      >
        {/* Cover: custom image OR 2×2 grid */}
        {coll.cover_url ? (
          <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", background: "#1a1210" }}>
            <Image src={coll.cover_url} alt={coll.name} fill style={{ objectFit: "cover" }} />
          </div>
        ) : (
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
        )}
        <div style={{ padding: "10px 12px" }}>
          {renaming ? (
            <input
              autoFocus
              value={renameVal}
              onClick={e => e.stopPropagation()}
              onChange={e => setRenameVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && renameVal.trim()) { onRename?.(renameVal.trim()); setRenaming(false); }
                if (e.key === "Escape") { setRenameVal(coll.name); setRenaming(false); }
              }}
              onBlur={() => { if (renameVal.trim()) onRename?.(renameVal.trim()); setRenaming(false); }}
              style={{
                background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.3)",
                color: "#fff", fontSize: "13px", fontWeight: 500, outline: "none", width: "100%",
              }}
            />
          ) : (
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", marginBottom: "2px" }}>{coll.name}</p>
          )}
          <p style={{ fontSize: "11px", color: "#6b5452" }}>{coll.count} {coll.count === 1 ? "score" : "scores"}</p>
        </div>
      </div>

      {/* Hidden file input for cover — must be outside menuOpen block */}
      {onCoverChange && (
        <input
          ref={coverInputRef}
          type="file" accept="image/*"
          style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onCoverChange(f); e.target.value = ""; }}
        />
      )}

      {/* Owner menu button */}
      {isOwner && coll.id !== "all" && (
        <div ref={menuRef} style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10 }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            style={{
              width: "26px", height: "26px", borderRadius: "6px",
              background: menuOpen || hovered ? "rgba(0,0,0,0.55)" : "transparent",
              border: "none", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
          >
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
          {menuOpen && (
            <div style={{
              position: "absolute", top: "30px", right: 0,
              background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "9px", padding: "6px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)", minWidth: "150px",
            }}>
              {onCoverChange && (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); setTimeout(() => coverInputRef.current?.click(), 50); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      width: "100%", padding: "8px 10px", background: "none",
                      border: "none", color: "#e8dbd8", fontSize: "13px",
                      cursor: "pointer", borderRadius: "6px", textAlign: "left",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    Change cover
                  </button>
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                </>
              )}
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(false); setRenaming(true); setRenameVal(coll.name); }}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  width: "100%", padding: "8px 10px", background: "none",
                  border: "none", color: "#e8dbd8", fontSize: "13px",
                  cursor: "pointer", borderRadius: "6px", textAlign: "left",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Rename
              </button>
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete?.(); }}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  width: "100%", padding: "8px 10px", background: "none",
                  border: "none", color: "#c0392b", fontSize: "13px",
                  cursor: "pointer", borderRadius: "6px", textAlign: "left",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(192,57,43,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      )}
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
  const [showMessageModal, setShowMessageModal] = useState(false);
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
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [collCoverCropSrc, setCollCoverCropSrc] = useState<string | null>(null);
  const [collCoverCropId, setCollCoverCropId] = useState<string | null>(null);
  const [newCollName, setNewCollName] = useState("");
  const [addingColl, setAddingColl] = useState(false);
  const [movingScore, setMovingScore] = useState<Score | null>(null);

  // Resource collections state
  const [resourceColls, setResourceColls] = useState<Collection[]>([]);
  const [activeResourceColl, setActiveResourceColl] = useState<string | "all" | null>(null);
  const [newRcollName, setNewRcollName] = useState("");
  const [addingRcoll, setAddingRcoll] = useState(false);
  const [movingResourceScore, setMovingResourceScore] = useState<Score | null>(null);
  const [resourceScoreMenuId, setResourceScoreMenuId] = useState<string | null>(null);
  const [savedScoreMenuId, setSavedScoreMenuId] = useState<string | null>(null);

  const initializedRef = useRef(false);

  // Auto-save text fields with debounce (owner only)
  useEffect(() => {
    if (!initializedRef.current || !currentUser || !profileUser || currentUser.id !== profileUser.id) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      const supabase = createClient();
      await supabase.from("profiles").update({
        display_name: displayName.trim() || profileUser?.handle,
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        twitter: twitter.trim(),
        instagram: instagram.trim(),
      }).eq("id", currentUser.id);
    }, 1200);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, bio, location, website, twitter, instagram]);

  useEffect(() => {
    if (!handle) return;
    initializedRef.current = false;
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
          .select("id, title, composer, tag, price_display, likes_count, views_count, category, instruments, pages, publisher, description, difficulty, author_id, midi_url, pdf_url, created_at, updated_at, cover_url, resource_collection_id")
          .eq("author_id", p.id).order("likes_count", { ascending: false }),
        supabase.from("saved_scores")
          .select("collection_id, scores(id, title, composer, tag, price_display, likes_count, views_count, category, cover_url, author_id, pdf_url, midi_url, instruments, pages, publisher, description, difficulty, created_at, updated_at)")
          .eq("user_id", p.id).order("saved_at", { ascending: false }),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", p.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", p.id),
      ]);

      const scores = (scoresRes.data as Score[]) ?? [];
      setUserScores(scores);

      // Load resource collections
      const { data: rcollData } = await supabase.from("resource_collections")
        .select("id, name, parent_id, cover_url").eq("user_id", p.id).order("created_at");
      const rawRcolls = (rcollData ?? []) as { id: string; name: string; parent_id: string | null; cover_url: string | null }[];
      const rcolls: Collection[] = rawRcolls.map(c => {
        const collScores = scores.filter(s => s.resource_collection_id === c.id);
        return { id: c.id, name: c.name, parent_id: c.parent_id ?? null, cover_url: c.cover_url ?? null, count: collScores.length, covers: collScores.slice(0, 4).map(s => s.cover_url ?? null) };
      });
      setResourceColls(rcolls);

      const savedRows = (savedRes.data ?? []) as unknown as { collection_id: string | null; scores: Score }[];
      const savedScores = savedRows.map(r => r.scores).filter(Boolean);
      const collIds = savedRows.map(r => r.collection_id);
      setSavedScores(savedScores);
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
          parent_id: null,
          count: idxs.length,
          covers: idxs.slice(0, 4).map(i => savedScores[i]?.cover_url ?? null),
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

  const saveBannerImmediate = async (gradient: string, imageUrl: string | null) => {
    if (!currentUser) return;
    const supabase = createClient();
    await supabase.from("profiles").update({ banner_gradient: gradient, banner_url: imageUrl }).eq("id", currentUser.id);
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
    setShowBannerPicker(false);
    saveBannerImmediate(bannerGradient, url);
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
      setCollections(prev => [...prev, { id: data.id, name: data.name, parent_id: null, count: 0, covers: [] }]);
      setNewCollName("");
    }
    setAddingColl(false);
  };

  const handleDeleteCollection = async (collId: string) => {
    if (!currentUser || !window.confirm("Delete this collection? Scores will move to All saved.")) return;
    const supabase = createClient();
    await supabase.from("collections").delete().eq("id", collId).eq("user_id", currentUser.id);
    setCollections(prev => prev.filter(c => c.id !== collId));
    setSavedCollectionIds(prev => prev.map(id => id === collId ? null : id));
  };

  const handleRenameCollection = async (collId: string, newName: string) => {
    if (!currentUser) return;
    const supabase = createClient();
    await supabase.from("collections").update({ name: newName }).eq("id", collId).eq("user_id", currentUser.id);
    setCollections(prev => prev.map(c => c.id === collId ? { ...c, name: newName } : c));
  };

  const handleMoveScore = async (scoreId: string, toCollId: string | null) => {
    if (!currentUser) return;
    const supabase = createClient();
    await supabase.from("saved_scores")
      .update({ collection_id: toCollId })
      .eq("score_id", scoreId)
      .eq("user_id", currentUser.id);
    const idx = savedScores.findIndex(s => s.id === scoreId);
    if (idx !== -1) setSavedCollectionIds(prev => prev.map((id, i) => i === idx ? toCollId : id));
    setMovingScore(null);
  };

  // ─── Resource collection handlers ───────────────────────────────────────
  const handleCreateResourceColl = async () => {
    if (!newRcollName.trim() || !currentUser) return;
    setAddingRcoll(true);
    const supabase = createClient();
    const parentId = (activeResourceColl && activeResourceColl !== "all" && activeResourceColl !== "unsorted") ? activeResourceColl : null;
    const { data } = await supabase.from("resource_collections")
      .insert({ user_id: currentUser.id, name: newRcollName.trim(), parent_id: parentId })
      .select("id, name, parent_id").single();
    if (data) {
      setResourceColls(prev => [...prev, { id: data.id, name: data.name, parent_id: data.parent_id ?? null, count: 0, covers: [] }]);
      setNewRcollName("");
    }
    setAddingRcoll(false);
  };

  const handleDeleteResourceColl = async (collId: string) => {
    if (!currentUser || !window.confirm("Delete this collection? Scores will move back to All resources.")) return;
    const supabase = createClient();
    await supabase.from("resource_collections").delete().eq("id", collId).eq("user_id", currentUser.id);
    setResourceColls(prev => prev.filter(c => c.id !== collId));
    setUserScores(prev => prev.map(s => s.resource_collection_id === collId ? { ...s, resource_collection_id: null } : s));
  };

  const handleRenameResourceColl = async (collId: string, newName: string) => {
    if (!currentUser) return;
    const supabase = createClient();
    await supabase.from("resource_collections").update({ name: newName }).eq("id", collId).eq("user_id", currentUser.id);
    setResourceColls(prev => prev.map(c => c.id === collId ? { ...c, name: newName } : c));
  };

  const handleUpdateCollectionCover = (collId: string, file: File) => {
    const src = URL.createObjectURL(file);
    setCollCoverCropId(collId);
    setCollCoverCropSrc(src);
  };

  const handleCollCoverCropConfirm = async (blob: Blob) => {
    if (!currentUser || !collCoverCropId) return;
    setCollCoverCropSrc(null);
    const supabase = createClient();
    const coverPath = `collection-covers/${currentUser.id}/${Date.now()}.jpg`;
    const { error: storageErr } = await supabase.storage.from("avatars").upload(coverPath, blob, { upsert: true });
    if (storageErr) {
      alert(`Cover upload failed: ${storageErr.message}`);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(coverPath);
    const { error: dbErr } = await supabase.from("resource_collections")
      .update({ cover_url: data.publicUrl })
      .eq("id", collCoverCropId)
      .eq("user_id", currentUser.id);
    if (dbErr) {
      alert(`Failed to save cover: ${dbErr.message}`);
      return;
    }
    setResourceColls(prev => prev.map(c => c.id === collCoverCropId ? { ...c, cover_url: data.publicUrl } : c));
    setCollCoverCropId(null);
  };

  const handleMoveResourceScore = async (scoreId: string, toCollId: string | null) => {
    if (!currentUser) return;
    const supabase = createClient();
    await supabase.from("scores").update({ resource_collection_id: toCollId }).eq("id", scoreId).eq("author_id", currentUser.id);
    setUserScores(prev => prev.map(s => s.id === scoreId ? { ...s, resource_collection_id: toCollId } : s));
    // Update collection counts & covers
    setResourceColls(prev => prev.map(c => {
      const collScores = userScores.map(s => s.id === scoreId ? { ...s, resource_collection_id: toCollId } : s).filter(s => s.resource_collection_id === c.id);
      return { ...c, count: collScores.length, covers: collScores.slice(0, 4).map(s => s.cover_url ?? null) };
    }));
    setMovingResourceScore(null);
  };

  const [deletingScore, setDeletingScore] = useState<Score | null>(null);

  const handleDeleteScore = async () => {
    if (!currentUser || !deletingScore) return;
    const supabase = createClient();
    await supabase.from("scores").delete().eq("id", deletingScore.id).eq("author_id", currentUser.id);
    setUserScores(prev => prev.filter(s => s.id !== deletingScore.id));
    setResourceColls(prev => prev.map(c => {
      const collScores = userScores.filter(s => s.id !== deletingScore.id && s.resource_collection_id === c.id);
      return { ...c, count: collScores.length, covers: collScores.slice(0, 4).map(s => s.cover_url ?? null) };
    }));
    setDeletingScore(null);
  };

  const handleRemoveFromSaved = async (scoreId: string) => {
    if (!currentUser) return;
    const supabase = createClient();
    await supabase.from("saved_scores").delete().eq("score_id", scoreId).eq("user_id", currentUser.id);
    const idx = savedScores.findIndex(s => s.id === scoreId);
    if (idx !== -1) {
      setSavedScores(prev => prev.filter((_, i) => i !== idx));
      setSavedCollectionIds(prev => prev.filter((_, i) => i !== idx));
    }
    setSavedScoreMenuId(null);
  };

  // ─── Saved tab view ──────────────────────────────────────────────────────
  // null = collection grid, "all" = all saved, "unsorted" = no collection, string = specific collection
  const visibleSaved = activeCollection === null ? [] :
    activeCollection === "all"
      ? savedScores
      : activeCollection === "unsorted"
      ? savedScores.filter((_, i) => savedCollectionIds[i] === null)
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
                          onClick={() => { setBannerGradient(g); setBannerImageUrl(null); setShowBannerPicker(false); saveBannerImmediate(g, null); }}
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
                          onClick={() => { setBannerImageUrl(null); setShowBannerPicker(false); saveBannerImmediate(bannerGradient, null); }}
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
                      <button
                        onClick={() => router.push("/community/messages")}
                        style={{
                          padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                          cursor: "pointer", background: "none", border: "1px solid rgba(255,255,255,0.15)",
                          color: "#a89690", display: "flex", alignItems: "center", gap: "6px",
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        My messages
                      </button>
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
                          setShowMessageModal(true);
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
                    <div>
                      {/* Breadcrumb when inside a collection */}
                      {activeResourceColl !== null && (() => {
                        const currentColl = resourceColls.find(c => c.id === activeResourceColl);
                        const parentColl = currentColl?.parent_id ? resourceColls.find(c => c.id === currentColl.parent_id) : null;
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                            <button onClick={() => {
                              setActiveResourceColl(currentColl?.parent_id ?? null);
                            }}
                              style={{ fontSize: "13px", color: "#6b5452", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                              {parentColl ? parentColl.name : "Collections"}
                            </button>
                            {parentColl && (
                              <>
                                <span style={{ fontSize: "13px", color: "#6b5452" }}>/</span>
                                <span style={{ fontSize: "13px", color: "#6b5452" }}>Collections</span>
                              </>
                            )}
                            <span style={{ fontSize: "13px", color: "#6b5452" }}>/</span>
                            <span style={{ fontSize: "13px", color: "#e8dbd8" }}>
                              {activeResourceColl === "all" ? "All resources" : activeResourceColl === "unsorted" ? "Unsorted" : currentColl?.name}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Collection overview */}
                      {activeResourceColl === null && (
                        <>
                          {userScores.length === 0 ? (
                            <p style={{ fontSize: "13px", color: "#6b5452" }}>No resources published yet.</p>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                              {/* "All resources" card */}
                              <CollectionCard
                                coll={{ id: "all", name: "All resources", count: userScores.length, covers: userScores.slice(0, 4).map(s => s.cover_url ?? null), parent_id: null }}
                                onClick={() => setActiveResourceColl("all")}
                              />
                              {/* Named collections (top-level only) */}
                              {resourceColls.filter(c => c.parent_id === null).map(c => (
                                <CollectionCard
                                  key={c.id} coll={c}
                                  onClick={() => setActiveResourceColl(c.id)}
                                  isOwner={isOwner}
                                  onDelete={() => handleDeleteResourceColl(c.id)}
                                  onRename={name => handleRenameResourceColl(c.id, name)}
                                  onCoverChange={isOwner ? (file) => handleUpdateCollectionCover(c.id, file) : undefined}
                                />
                              ))}
                              {/* Unsorted */}
                              {(() => {
                                const unsorted = userScores.filter(s => !s.resource_collection_id);
                                return unsorted.length > 0 && resourceColls.filter(c => c.parent_id === null).length > 0 ? (
                                  <CollectionCard
                                    coll={{ id: "unsorted", name: "Unsorted", count: unsorted.length, covers: unsorted.slice(0, 4).map(s => s.cover_url ?? null), parent_id: null }}
                                    onClick={() => setActiveResourceColl("unsorted" as string)}
                                  />
                                ) : null;
                              })()}
                            </div>
                          )}

                          {/* Create collection (owner only) */}
                          {isOwner && userScores.length > 0 && (
                            <div style={{ marginTop: "20px", display: "flex", gap: "8px", maxWidth: "340px" }}>
                              <input
                                type="text"
                                placeholder="New collection name…"
                                value={newRcollName}
                                onChange={e => setNewRcollName(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleCreateResourceColl(); }}
                                style={{
                                  flex: 1, padding: "8px 12px", borderRadius: "8px",
                                  background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
                                  color: "#fff", fontSize: "13px", outline: "none",
                                }}
                              />
                              <button
                                onClick={handleCreateResourceColl}
                                disabled={!newRcollName.trim() || addingRcoll}
                                style={{
                                  padding: "8px 16px", borderRadius: "8px", background: "#fff",
                                  color: "#211817", fontSize: "13px", fontWeight: 600,
                                  border: "none", cursor: "pointer",
                                  opacity: !newRcollName.trim() || addingRcoll ? 0.5 : 1,
                                }}
                              >
                                + Create
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* Create folder (owner only, inside a real collection) */}
                      {activeResourceColl !== null && activeResourceColl !== "all" && activeResourceColl !== "unsorted" && isOwner && (
                        <div style={{ marginTop: "20px", display: "flex", gap: "8px", maxWidth: "340px" }}>
                          <input
                            type="text"
                            placeholder="New folder name…"
                            value={newRcollName}
                            onChange={e => setNewRcollName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleCreateResourceColl(); }}
                            style={{
                              flex: 1, padding: "8px 12px", borderRadius: "8px",
                              background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
                              color: "#fff", fontSize: "13px", outline: "none",
                            }}
                          />
                          <button
                            onClick={handleCreateResourceColl}
                            disabled={!newRcollName.trim() || addingRcoll}
                            style={{
                              padding: "8px 16px", borderRadius: "8px", background: "#fff",
                              color: "#211817", fontSize: "13px", fontWeight: 600,
                              border: "none", cursor: "pointer",
                              opacity: !newRcollName.trim() || addingRcoll ? 0.5 : 1,
                            }}
                          >
                            + Folder
                          </button>
                        </div>
                      )}

                      {/* Scores inside a collection */}
                      {activeResourceColl !== null && (() => {
                        const visible = activeResourceColl === "all"
                          ? userScores
                          : activeResourceColl === "unsorted"
                          ? userScores.filter(s => !s.resource_collection_id)
                          : userScores.filter(s => s.resource_collection_id === activeResourceColl);
                        const isRealCollection = activeResourceColl !== "all" && activeResourceColl !== "unsorted";
                        const subFolders = isRealCollection ? resourceColls.filter(c => c.parent_id === activeResourceColl) : [];
                        return (
                          <>
                            {/* Sub-folders */}
                            {subFolders.length > 0 && (
                              <div style={{ marginBottom: "20px" }}>
                                <p style={{ fontSize: "11px", color: "#6b5452", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Folders</p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                                  {subFolders.map(c => (
                                    <CollectionCard
                                      key={c.id} coll={c}
                                      onClick={() => setActiveResourceColl(c.id)}
                                      isOwner={isOwner}
                                      onDelete={() => handleDeleteResourceColl(c.id)}
                                      onRename={name => handleRenameResourceColl(c.id, name)}
                                  onCoverChange={isOwner ? (file) => handleUpdateCollectionCover(c.id, file) : undefined}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {visible.length > 0 ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}
                            onClick={() => resourceScoreMenuId && setResourceScoreMenuId(null)}>
                            {visible.map(s => (
                              <div key={s.id} style={{ position: "relative", minWidth: 0 }}>
                                <ScoreCard score={s} isOwner={isOwner} onEdit={setEditingScore} />
                                {isOwner && (
                                  <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10 }}>
                                    <button
                                      onClick={e => { e.stopPropagation(); setResourceScoreMenuId(resourceScoreMenuId === s.id ? null : s.id); }}
                                      style={{
                                        width: "26px", height: "26px", borderRadius: "6px",
                                        background: resourceScoreMenuId === s.id ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
                                        border: "none", color: "#fff", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        backdropFilter: "blur(4px)",
                                      }}
                                    >
                                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                        <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                                      </svg>
                                    </button>
                                    {resourceScoreMenuId === s.id && (
                                      <div
                                        onClick={e => e.stopPropagation()}
                                        style={{
                                          position: "absolute", top: "30px", right: 0,
                                          background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                                          borderRadius: "9px", padding: "6px",
                                          boxShadow: "0 8px 24px rgba(0,0,0,0.5)", minWidth: "150px", zIndex: 20,
                                        }}
                                      >
                                        <button
                                          onClick={() => { setResourceScoreMenuId(null); setMovingResourceScore(s); }}
                                          style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 10px", background: "none", border: "none", color: "#e8dbd8", fontSize: "13px", cursor: "pointer", borderRadius: "6px" }}
                                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                                        >
                                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                          Move to…
                                        </button>
                                        <button
                                          onClick={() => { setResourceScoreMenuId(null); setEditingScore(s); }}
                                          style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 10px", background: "none", border: "none", color: "#e8dbd8", fontSize: "13px", cursor: "pointer", borderRadius: "6px" }}
                                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                                        >
                                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                          Edit score
                                        </button>
                                        <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                                        <button
                                          onClick={() => { setResourceScoreMenuId(null); setDeletingScore(s); }}
                                          style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 10px", background: "none", border: "none", color: "#c0392b", fontSize: "13px", cursor: "pointer", borderRadius: "6px" }}
                                          onMouseEnter={e => e.currentTarget.style.background = "rgba(192,57,43,0.12)"}
                                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                                        >
                                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                          Delete score
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                            ) : (
                              <p style={{ fontSize: "13px", color: "#6b5452" }}>No scores in this collection yet.</p>
                            )}
                          </>
                        );
                      })()}

                      {/* Move score modal */}
                      {movingResourceScore && (
                        <div
                          onClick={() => setMovingResourceScore(null)}
                          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <div onClick={e => e.stopPropagation()} style={{
                            background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "14px", padding: "20px", minWidth: "280px",
                            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                          }}>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "14px" }}>
                              Move &ldquo;{movingResourceScore.title}&rdquo; to…
                            </p>
                            <button
                              onClick={() => handleMoveResourceScore(movingResourceScore.id, null)}
                              style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "9px 10px", background: "none", border: "none", color: "#e8dbd8", fontSize: "13px", cursor: "pointer", borderRadius: "7px", textAlign: "left" }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}
                            >
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                              All resources (no collection)
                            </button>
                            {resourceColls.map(c => (
                              <button key={c.id}
                                onClick={() => handleMoveResourceScore(movingResourceScore.id, c.id)}
                                style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "9px 10px", background: "none", border: "none", color: "#e8dbd8", fontSize: "13px", cursor: "pointer", borderRadius: "7px", textAlign: "left", paddingLeft: c.parent_id ? "28px" : "10px" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                              >
                                <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.5 }}><path d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.4A1 1 0 0011.121 6.4L12.3 5.3A1 1 0 0113 5h6a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
                                {c.parent_id && <span style={{ opacity: 0.5, marginRight: "3px" }}>↳</span>}{c.name}
                              </button>
                            ))}
                            <button onClick={() => setMovingResourceScore(null)} style={{ width: "100%", marginTop: "8px", padding: "8px", background: "none", border: "none", color: "#6b5452", fontSize: "12px", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delete score confirmation */}
                  {deletingScore && (
                    <div
                      onClick={() => setDeletingScore(null)}
                      style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <div onClick={e => e.stopPropagation()} style={{
                        background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "16px", padding: "28px 24px", maxWidth: "360px", width: "100%",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(192,57,43,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="16" height="16" fill="none" stroke="#c0392b" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </div>
                          <div>
                            <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>Delete score?</p>
                            <p style={{ fontSize: "12px", color: "#6b5452", margin: "2px 0 0" }}>This action cannot be undone</p>
                          </div>
                        </div>
                        <p style={{ fontSize: "13px", color: "#c8b8b6", margin: "0 0 20px", lineHeight: 1.5 }}>
                          Are you sure you want to delete <strong style={{ color: "#e8dbd8" }}>&ldquo;{deletingScore.title}&rdquo;</strong>? The PDF and all associated files will be permanently removed.
                        </p>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => setDeletingScore(null)}
                            style={{ flex: 1, padding: "9px", borderRadius: "9px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#c8b8b6", fontSize: "13px", cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteScore}
                            style={{ flex: 1, padding: "9px", borderRadius: "9px", background: "#c0392b", border: "none", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
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
                            {activeCollection === "all" ? "All saved" : activeCollection === "unsorted" ? "Unsorted" : collections.find(c => c.id === activeCollection)?.name}
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
                                coll={{ id: "all", name: "All saved", count: savedScores.length, covers: savedScores.slice(0, 4).map(s => s.cover_url ?? null), parent_id: null }}
                                onClick={() => setActiveCollection("all")}
                              />
                              {/* Named collections */}
                              {collections.map(c => (
                                <CollectionCard
                                  key={c.id} coll={c}
                                  onClick={() => setActiveCollection(c.id)}
                                  isOwner={isOwner}
                                  onDelete={() => handleDeleteCollection(c.id)}
                                  onRename={name => handleRenameCollection(c.id, name)}
                                />
                              ))}
                              {/* Unsorted */}
                              {unsortedSaved.length > 0 && collections.length > 0 && (
                                <CollectionCard
                                  coll={{ id: "unsorted", name: "Unsorted", count: unsortedSaved.length, covers: unsortedSaved.slice(0, 4).map(s => s.cover_url ?? null), parent_id: null }}
                                  onClick={() => setActiveCollection("unsorted")}
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
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}
                            onClick={() => savedScoreMenuId && setSavedScoreMenuId(null)}>
                            {visibleSaved.map(s => (
                              <div key={s.id} style={{ position: "relative", minWidth: 0 }}>
                                <ScoreCard score={s} />
                                {isOwner && (
                                  <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10 }}>
                                    <button
                                      onClick={e => { e.stopPropagation(); setSavedScoreMenuId(savedScoreMenuId === s.id ? null : s.id); }}
                                      style={{
                                        width: "26px", height: "26px", borderRadius: "6px",
                                        background: savedScoreMenuId === s.id ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
                                        border: "none", color: "#fff", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        backdropFilter: "blur(4px)",
                                      }}
                                    >
                                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                        <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                                      </svg>
                                    </button>
                                    {savedScoreMenuId === s.id && (
                                      <div
                                        onClick={e => e.stopPropagation()}
                                        style={{
                                          position: "absolute", top: "30px", right: 0,
                                          background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                                          borderRadius: "9px", padding: "6px",
                                          boxShadow: "0 8px 24px rgba(0,0,0,0.5)", minWidth: "150px", zIndex: 20,
                                        }}
                                      >
                                        <button
                                          onClick={() => { setSavedScoreMenuId(null); setMovingScore(s); }}
                                          style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 10px", background: "none", border: "none", color: "#e8dbd8", fontSize: "13px", cursor: "pointer", borderRadius: "6px" }}
                                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                                        >
                                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                          Move to…
                                        </button>
                                        <button
                                          onClick={() => handleRemoveFromSaved(s.id)}
                                          style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 10px", background: "none", border: "none", color: "#c0392b", fontSize: "13px", cursor: "pointer", borderRadius: "6px" }}
                                          onMouseEnter={e => e.currentTarget.style.background = "rgba(192,57,43,0.1)"}
                                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                                        >
                                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                                          Remove
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: "13px", color: "#6b5452" }}>No scores in this collection yet.</p>
                        )
                      )}

                      {/* Move score modal */}
                      {movingScore && (
                        <div
                          onClick={() => setMovingScore(null)}
                          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <div onClick={e => e.stopPropagation()} style={{
                            background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "14px", padding: "20px", minWidth: "280px",
                            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                          }}>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "14px" }}>
                              Move &ldquo;{movingScore.title}&rdquo; to…
                            </p>
                            <button
                              onClick={() => handleMoveScore(movingScore.id, null)}
                              style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "9px 10px", background: "none", border: "none", color: "#e8dbd8", fontSize: "13px", cursor: "pointer", borderRadius: "7px", textAlign: "left" }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}
                            >
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                              All saved (no collection)
                            </button>
                            {collections.map(c => (
                              <button key={c.id}
                                onClick={() => handleMoveScore(movingScore.id, c.id)}
                                style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "9px 10px", background: "none", border: "none", color: "#e8dbd8", fontSize: "13px", cursor: "pointer", borderRadius: "7px", textAlign: "left" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                              >
                                <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.5 }}><path d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.4A1 1 0 0011.121 6.4L12.3 5.3A1 1 0 0113 5h6a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
                                {c.name}
                              </button>
                            ))}
                            <button onClick={() => setMovingScore(null)} style={{ width: "100%", marginTop: "8px", padding: "8px", background: "none", border: "none", color: "#6b5452", fontSize: "12px", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
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
      {collCoverCropSrc && (
        <CoverCropper
          imageSrc={collCoverCropSrc}
          onConfirm={handleCollCoverCropConfirm}
          onCancel={() => { setCollCoverCropSrc(null); setCollCoverCropId(null); }}
        />
      )}
      {showMessageModal && currentUser && profileUser && (
        <MessageModal
          currentUserId={currentUser.id}
          recipient={{
            id: profileUser.id,
            handle: profileUser.handle,
            display_name: profileUser.display_name ?? null,
            avatar_url: avatarUrl,
          }}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </>
  );
}
