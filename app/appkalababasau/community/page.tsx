"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import type { Score, Profile } from "@/lib/supabase/types";
import { SCORE_TAGS } from "@/lib/scores";
import UploadScoreModal from "@/components/community/UploadScoreModal";

const BANNER_GRADIENTS = [
  "linear-gradient(135deg, #7a2318 0%, #c0392b 60%, #8b2c1e 100%)",
  "linear-gradient(135deg, #1a3a5c 0%, #2563eb 60%, #1e3a8a 100%)",
  "linear-gradient(135deg, #1a4a2e 0%, #16a34a 60%, #14532d 100%)",
  "linear-gradient(135deg, #3b1f5e 0%, #7c3aed 60%, #4c1d95 100%)",
  "linear-gradient(135deg, #4a3000 0%, #d97706 60%, #92400e 100%)",
  "linear-gradient(135deg, #1e3040 0%, #0e7490 60%, #164e63 100%)",
];

function InlineField({ value, onChange, placeholder, style, multiline }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  style?: React.CSSProperties; multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const sharedStyle: React.CSSProperties = {
    background: "none", border: "none", outline: "none",
    color: value ? "#e8dbd8" : "#3d2a28", fontSize: "inherit",
    fontFamily: "inherit", fontWeight: "inherit", lineHeight: "inherit",
    width: "100%", padding: "2px 0", cursor: "text",
    borderBottom: editing ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
    resize: "none",
    ...style,
  };
  if (multiline) return (
    <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} onFocus={() => setEditing(true)} onBlur={() => setEditing(false)}
      rows={2} style={{ ...sharedStyle, display: "block" }} />
  );
  return (
    <input ref={ref as React.RefObject<HTMLInputElement>} type="text" value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} onFocus={() => setEditing(true)} onBlur={() => setEditing(false)}
      style={sharedStyle} />
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileTab, setProfileTab] = useState<"resources" | "saved" | "metrics">("resources");
  const [bannerGradient, setBannerGradient] = useState(BANNER_GRADIENTS[0]);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [saving, setSaving] = useState(false);
  const [userScores, setUserScores] = useState<Score[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data as Profile);
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setLocation(data.location || "");
        setWebsite(data.website || "");
        setTwitter(data.twitter || "");
        setInstagram(data.instagram || "");
        if (data.banner_gradient) setBannerGradient(data.banner_gradient);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    });
    supabase.from("scores").select("id, title, composer, tag, price_display, likes_count, views_count, category, instruments, pages, publisher, description, difficulty, author_id, midi_url, pdf_url, created_at, updated_at")
      .eq("author_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setUserScores((data as Score[]) ?? []));
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({
      display_name: displayName,
      bio,
      location,
      website,
      twitter,
      instagram,
      banner_gradient: bannerGradient,
    }).eq("id", user.id);
    setSaving(false);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const supabase = createClient();
    const { error } = await supabase.storage
      .from("avatars").upload(path, file, { upsert: true });
    if (error) {
      alert("Upload failed: " + error.message);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(url);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
  };

  const handle = profile?.handle ?? user?.email?.split("@")[0] ?? "";
  const initials = (displayName || handle || "?")[0].toUpperCase();

  return (
    <div>
      {/* Banner */}
      <div style={{ position: "relative", height: "130px", background: bannerGradient, cursor: "pointer" }}
        onClick={() => setShowBannerPicker(v => !v)}>
        <div style={{
          position: "absolute", bottom: "10px", right: "14px",
          fontSize: "11px", color: "rgba(255,255,255,0.6)",
          background: "rgba(0,0,0,0.3)", padding: "4px 10px", borderRadius: "6px",
          backdropFilter: "blur(4px)",
        }}>
          Edit banner
        </div>
        {showBannerPicker && (
          <div onClick={e => e.stopPropagation()} style={{
            position: "absolute", bottom: "-58px", right: "14px", zIndex: 20,
            background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", padding: "8px 10px",
            display: "flex", gap: "6px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
            {BANNER_GRADIENTS.map((g, i) => (
              <div key={i} onClick={() => { setBannerGradient(g); setShowBannerPicker(false); }} style={{
                width: "28px", height: "28px", borderRadius: "6px", background: g,
                cursor: "pointer", border: bannerGradient === g ? "2px solid #fff" : "2px solid transparent",
                transition: "border-color 0.15s",
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Avatar + name row */}
      <div style={{ padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-30px", marginBottom: "16px" }}>
          <div style={{ position: "relative" }}>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
            <div
              onClick={() => avatarInputRef.current?.click()}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: avatarUrl ? "transparent" : "#c0392b",
                border: "3px solid #211817",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "28px", fontWeight: 600, color: "#fff",
                cursor: "pointer", overflow: "hidden", position: "relative",
                transition: "border-color 0.15s",
              }}>
              {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
              {avatarHover && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                  <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span style={{ fontSize: "9px", color: "#fff", fontWeight: 500 }}>Edit</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "6px 16px", borderRadius: "8px", background: "#fff", color: "#211817",
            fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "none",
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "flex", gap: "32px" }}>
          {/* Left: profile info */}
          <div style={{ width: "200px", flexShrink: 0 }}>
            <div style={{ marginBottom: "2px" }}>
              <InlineField value={displayName} onChange={setDisplayName} placeholder="Your name"
                style={{ fontSize: "18px", fontWeight: 600, color: "#fff" }} />
            </div>
            <p style={{ fontSize: "12px", color: "#6b5452", marginBottom: "14px" }}>@{handle}</p>

            <div style={{ display: "flex", gap: "14px", marginBottom: "14px" }}>
              <span style={{ fontSize: "13px", color: "#a89690" }}><b style={{ color: "#e8dbd8" }}>0</b> followers</span>
              <span style={{ fontSize: "13px", color: "#a89690" }}><b style={{ color: "#e8dbd8" }}>0</b> following</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {[
                { val: bio, set: setBio, placeholder: "Add a description", icon: "M4 6h16M4 12h16M4 18h7" },
                { val: location, set: setLocation, placeholder: "Add a location", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a3 3 0 110-6 3 3 0 010 6z" },
                { val: website, set: setWebsite, placeholder: "Add website URL", icon: "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0c-2.8 2.7-4 6-4 10s1.2 7.3 4 10m0-20c2.8 2.7 4 6 4 10s-1.2 7.3-4 10M2 12h20" },
                { val: twitter, set: setTwitter, placeholder: "Add X handle", icon: "M4 4l16 16M4 20L20 4" },
                { val: instagram, set: setInstagram, placeholder: "Add Instagram handle", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" },
              ].map(({ val, set, placeholder, icon }) => (
                <div key={placeholder} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <svg width="13" height="13" fill="none" stroke="#3d2a28" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path d={icon} />
                  </svg>
                  <InlineField value={val} onChange={set} placeholder={placeholder}
                    style={{ fontSize: "12px", color: val ? "#a89690" : "#3d2a28" }} />
                </div>
              ))}
            </div>

          </div>

          {/* Right: tabs + content */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "24px" }}>
              {(["resources", "saved", "metrics"] as const).map(t => (
                <button key={t} onClick={() => setProfileTab(t)} style={{
                  padding: "10px 14px", fontSize: "12px",
                  fontWeight: profileTab === t ? 500 : 400,
                  color: profileTab === t ? "#fff" : "#6b5452",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: profileTab === t ? "2px solid #c0392b" : "2px solid transparent",
                  transition: "color 0.15s", textTransform: "capitalize",
                }}>
                  {t === "saved" || t === "metrics"
                    ? <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      </span>
                    : "Resources"
                  }
                </button>
              ))}
            </div>

            {profileTab === "resources" && (
              userScores.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                  {userScores.map(s => (
                    <Link key={s.id} href={`/community/${s.id}`} style={{ textDecoration: "none", fontSize: "13px", color: "#e8dbd8", padding: "10px 12px", borderRadius: "8px", background: "#1e1513", border: "1px solid rgba(255,255,255,0.07)", display: "block" }}>
                      <p style={{ marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</p>
                      <p style={{ fontSize: "11px", color: "#6b5452" }}>{s.likes_count} likes · {s.views_count} views</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", paddingTop: "32px" }}>
                  <svg width="64" height="64" viewBox="0 0 80 80" fill="none" style={{ margin: "0 auto 16px", display: "block" }}>
                    <rect x="10" y="15" width="36" height="46" rx="4" fill="#2a1f1e" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
                    <rect x="20" y="10" width="36" height="46" rx="4" fill="#362420" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
                    <rect x="30" y="5" width="36" height="46" rx="4" fill="#3d2a28" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                    <line x1="38" y1="18" x2="58" y2="18" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="38" y1="24" x2="58" y2="24" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="38" y1="30" x2="50" y2="30" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontSize: "14px", color: "#6b5452", marginBottom: "6px" }}>You don&apos;t have any resources yet.</p>
                  <p style={{ fontSize: "12px", color: "#3d2a28" }}>Upload a score to get started.</p>
                </div>
              )
            )}
            {profileTab === "saved" && (
              <div style={{ textAlign: "center", paddingTop: "32px" }}>
                <p style={{ fontSize: "13px", color: "#6b5452" }}>Saved resources will appear here.</p>
              </div>
            )}
            {profileTab === "metrics" && (
              <div style={{ textAlign: "center", paddingTop: "32px" }}>
                <p style={{ fontSize: "13px", color: "#6b5452" }}>Metrics available once you publish a resource.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_CARDS = [
  { name: "Piano", desc: "Solo works, concertos, and accompaniment scores", image: "/categories/piano.png" },
  { name: "Strings", desc: "Violin, cello, viola, and ensemble arrangements", image: "/categories/strings-v2.png" },
  { name: "Brass", desc: "Trumpet, trombones, horn, and brass ensemble scores", image: "/categories/brass.png" },
  { name: "Symphonic", desc: "Full orchestra works and grand ensemble pieces", image: "/categories/Symphomic.png" },
  { name: "Guitar", desc: "Classical, acoustic, and fingerstyle guitar scores", image: "/categories/guitar.png" },
  { name: "Choir", desc: "Vocal ensembles, a cappella and choral arrangements", image: "/categories/choir.png" },
];

// ─── Collection card (Pinterest style) ──────────────────────────────────────
type Collection = { id: string; name: string; count: number; covers: (string | null)[] };

function CollectionCard({ coll, onClick }: { coll: Collection; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const covers = [...coll.covers.slice(0, 4)];
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", aspectRatio: "1/1" }}>
        {covers.map((src, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden", background: "#1a1210" }}>
            {src
              ? <Image src={src} alt="" fill style={{ objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" viewBox="0 0 24 24">
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
          transition: "all 0.2s ease", cursor: "pointer",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ background: "#f5f0eb", aspectRatio: "4/3", position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <Image src="/scoreimagedefaultpreview.png" alt={score.title} fill style={{ objectFit: "cover" }} />
          {hovered && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(33,24,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#fff", padding: "8px 18px", borderRadius: "20px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)" }}>View score</span>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{score.title}</p>
          <Link
            href={`/community/user/${handle}`}
            onClick={e => e.stopPropagation()}
            style={{ fontSize: "11px", color: "#6b5452", textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#a89690")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
          >
            @{handle}
          </Link>
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

export default function AppCommunityPage() {
  const [tab, setTab] = useState<"browse" | "saved" | "profile">("browse");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [pianoScores, setPianoScores] = useState<Score[]>([]);
  const [brassScores, setBrassScores] = useState<Score[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // Saved tab state
  const { user } = useAuth();
  const [savedScores, setSavedScores] = useState<Score[]>([]);
  const [savedCollectionIds, setSavedCollectionIds] = useState<(string | null)[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | "all" | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [newCollName, setNewCollName] = useState("");
  const [addingColl, setAddingColl] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("scores")
      .select("id, title, composer, tag, price_display, likes_count, views_count, category, author_id, instruments, pages, publisher, description, difficulty, midi_url, pdf_url, created_at, updated_at, profiles!scores_author_id_fkey(handle, display_name, avatar_url)")
      .order("likes_count", { ascending: false })
      .then(({ data }) => {
        if (data) {
          const scores = data as unknown as Score[];
          setPianoScores(scores.filter(s => s.category === "piano"));
          setBrassScores(scores.filter(s => s.category === "brass"));
        }
        setLoadingScores(false);
      });
  }, [showUpload]); // re-fetch after upload

  // Load saved scores + collections when tab becomes active
  useEffect(() => {
    if (tab !== "saved" || savedLoaded || !user) return;
    setLoadingSaved(true);
    const supabase = createClient();
    async function loadSaved() {
      const [savedRes, collRes] = await Promise.all([
        supabase.from("saved_scores")
          .select("collection_id, scores(id, title, composer, tag, price_display, likes_count, views_count, category, cover_url, author_id, pdf_url, midi_url, instruments, pages, publisher, description, difficulty, created_at, updated_at)")
          .eq("user_id", user!.id).order("saved_at", { ascending: false }),
        supabase.from("collections")
          .select("id, name").eq("user_id", user!.id).order("created_at"),
      ]);
      const rows = (savedRes.data ?? []) as unknown as { collection_id: string | null; scores: Score }[];
      const scores = rows.map(r => r.scores).filter(Boolean);
      const collIds = rows.map(r => r.collection_id);
      setSavedScores(scores);
      setSavedCollectionIds(collIds);
      const rawColls = (collRes.data ?? []) as { id: string; name: string }[];
      const colls: Collection[] = rawColls.map(c => {
        const idxs = collIds.map((cid, i) => cid === c.id ? i : -1).filter(i => i >= 0);
        return { id: c.id, name: c.name, count: idxs.length, covers: idxs.slice(0, 4).map(i => scores[i]?.cover_url ?? null) };
      });
      setCollections(colls);
      setLoadingSaved(false);
      setSavedLoaded(true);
    }
    loadSaved();
  }, [tab, savedLoaded, user]);

  const handleCreateCollection = async () => {
    if (!newCollName.trim() || !user) return;
    setAddingColl(true);
    const supabase = createClient();
    const { data } = await supabase.from("collections")
      .insert({ user_id: user.id, name: newCollName.trim() })
      .select("id, name").single();
    if (data) setCollections(prev => [...prev, { id: data.id, name: data.name, count: 0, covers: [] }]);
    setNewCollName("");
    setAddingColl(false);
  };

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
    <div style={{ minHeight: "100%" }}>
      {/* Tabs */}
      <div style={{
        display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 28px", position: "sticky", top: 0, zIndex: 10, background: "#211817",
      }}>
        {(["browse", "saved", "profile"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "13px 16px", fontSize: "13px",
            fontWeight: tab === t ? 500 : 400,
            color: tab === t ? "#fff" : "#6b5452",
            background: "none", border: "none", cursor: "pointer",
            borderBottom: tab === t ? "2px solid #c0392b" : "2px solid transparent",
            transition: "color 0.15s",
          }}>
            {t === "browse" ? "Browse" : t === "saved" ? "Saved" : "My Profile"}
          </button>
        ))}
      </div>

      {/* ── BROWSE ── */}
      {tab === "browse" && (
        <div>
          <div style={{ padding: "36px 28px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <svg style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b5452", pointerEvents: "none" }}
                  width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text" placeholder="Search scores, composers, arrangements…"
                  value={query} onChange={e => setQuery(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px 10px 38px", borderRadius: "8px",
                    background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              {/* Upload button intentionally removed — scores are managed via /scoresynth-admin */}
            </div>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
              {SCORE_TAGS.map(tag => (
                <button key={tag} onClick={() => setActiveTag(tag)} style={{
                  padding: "5px 14px", borderRadius: "20px", fontSize: "12px",
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
          </div>

          <div style={{ padding: "32px 28px 48px" }}>
            {/* Best of Piano */}
            <section style={{ marginBottom: "48px" }}>
              <div style={{ marginBottom: "18px" }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#fff", marginBottom: "4px" }}>Best of Piano</h2>
                <p style={{ fontSize: "12px", color: "#7a6360" }}>The most searched and loved piano scores in the community.</p>
              </div>
              {loadingScores ? (
                <p style={{ fontSize: "13px", color: "#6b5452" }}>Loading…</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                  {filteredPiano.map(s => <ScoreCard key={s.id} score={s} />)}
                </div>
              )}
            </section>

            {/* Popular categories */}
            <section style={{ marginBottom: "48px" }}>
              <div style={{ marginBottom: "18px" }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#fff", marginBottom: "4px" }}>Popular categories</h2>
                <p style={{ fontSize: "12px", color: "#7a6360" }}>Explore scores by instrument and style.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                {CATEGORY_CARDS.map(cat => (
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
                      <div style={{ padding: "14px 16px", flex: 1 }}>
                        <p style={{ fontFamily: "Georgia, serif", fontSize: "15px", color: "#fff", marginBottom: "3px" }}>{cat.name}</p>
                        <p style={{ fontSize: "11px", color: "#7a6360", lineHeight: 1.5 }}>{cat.desc}</p>
                      </div>
                      <div style={{ width: "90px", minWidth: "90px", alignSelf: "stretch", position: "relative", flexShrink: 0 }}>
                        <Image src={cat.image} alt={cat.name} fill style={{ objectFit: "cover" }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Brass Bands */}
            <section style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "18px" }}>
                <div>
                  <h2 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#fff", marginBottom: "4px" }}>Brass Bands</h2>
                  <p style={{ fontSize: "12px", color: "#7a6360" }}>Arrangements for brass ensembles, orchestras, and wind bands.</p>
                </div>
                <Link href="/community/category/brass" style={{ fontSize: "12px", color: "#6b8fbd", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Browse all →
                </Link>
              </div>
              {loadingScores ? (
                <p style={{ fontSize: "13px", color: "#6b5452" }}>Loading…</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                  {filteredBrass.map(s => <ScoreCard key={s.id} score={s} />)}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ── SAVED ── */}
      {tab === "saved" && (
        <div style={{ padding: "28px 28px 48px" }}>
          {loadingSaved ? (
            <p style={{ fontSize: "13px", color: "#6b5452" }}>Loading…</p>
          ) : (
            <>
              {/* Sub-nav when inside a collection */}
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

              {/* Collection overview grid */}
              {activeCollection === null && (
                <>
                  {savedScores.length === 0 ? (
                    <div style={{ textAlign: "center", paddingTop: "48px" }}>
                      <svg width="48" height="48" fill="none" stroke="#3d2a28" strokeWidth="1.2" viewBox="0 0 24 24" style={{ margin: "0 auto 14px", display: "block" }}>
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                      </svg>
                      <p style={{ fontSize: "14px", color: "#6b5452", marginBottom: "6px" }}>No saved scores yet.</p>
                      <p style={{ fontSize: "12px", color: "#3d2a28" }}>Open any score and click Save.</p>
                      <button onClick={() => setTab("browse")} style={{
                        marginTop: "16px", padding: "8px 20px", borderRadius: "8px",
                        background: "#c0392b", border: "none", color: "#fff",
                        fontSize: "13px", fontWeight: 500, cursor: "pointer",
                      }}>Browse scores</button>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                      {/* All saved */}
                      <CollectionCard
                        coll={{ id: "all", name: "All saved", count: savedScores.length, covers: savedScores.slice(0, 4).map(s => s.cover_url ?? null) }}
                        onClick={() => setActiveCollection("all")}
                      />
                      {/* Named collections */}
                      {collections.filter(c => c.count > 0).map(c => (
                        <CollectionCard key={c.id} coll={c} onClick={() => setActiveCollection(c.id)} />
                      ))}
                    </div>
                  )}

                  {/* Create new collection */}
                  <div style={{ marginTop: "20px", display: "flex", gap: "8px", maxWidth: "320px" }}>
                    <input
                      type="text" placeholder="New collection…" value={newCollName}
                      onChange={e => setNewCollName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleCreateCollection(); }}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: "8px",
                        background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff", fontSize: "12px", outline: "none",
                      }}
                    />
                    <button onClick={handleCreateCollection} disabled={!newCollName.trim() || addingColl}
                      style={{ padding: "8px 14px", borderRadius: "8px", background: "#fff", color: "#211817", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}>
                      + Create
                    </button>
                  </div>
                </>
              )}

              {/* Scores inside a collection */}
              {activeCollection !== null && (() => {
                const visible = activeCollection === "all"
                  ? savedScores
                  : savedScores.filter((_, i) => savedCollectionIds[i] === activeCollection);
                return visible.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                    {visible.map(s => (
                      <Link key={s.id} href={`/community/${s.id}`} style={{ textDecoration: "none" }}>
                        <div style={{ borderRadius: "12px", overflow: "hidden", background: "#1e1513", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div style={{ aspectRatio: "4/3", position: "relative", background: "#1a1210" }}>
                            {s.cover_url
                              ? <Image src={s.cover_url} alt={s.title} fill style={{ objectFit: "cover" }} />
                              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                                </div>
                            }
                          </div>
                          <div style={{ padding: "10px 12px" }}>
                            <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</p>
                            <p style={{ fontSize: "11px", color: "#6b5452", marginTop: "2px" }}>{s.composer}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#6b5452" }}>No scores in this collection yet.</p>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ── PROFILE ── */}
      {tab === "profile" && <ProfileTab />}

      {/* Upload modal */}
      {showUpload && (
        <UploadScoreModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
