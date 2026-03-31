"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import type { Score } from "@/lib/supabase/types";

// ─── admin handle ────────────────────────────────────────────────────────────
// Change this if you rename the account
const ADMIN_HANDLE = "mayyascoresynth";

const CATEGORIES = ["piano", "brass", "strings", "symphonic", "guitar", "choir"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  background: "#1e1513",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Upload form state
  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [publisher, setPublisher] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [category, setCategory] = useState("piano");
  const [instruments, setInstruments] = useState("");
  const [tag, setTag] = useState<"free" | "premium">("free");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [pages, setPages] = useState(1);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Score list state
  const [scores, setScores] = useState<Score[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Check if logged-in user is the admin ─────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setCheckingAdmin(false); return; }

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.handle === ADMIN_HANDLE);
        setCheckingAdmin(false);
      });
  }, [user, authLoading]);

  // ─── Load scores ──────────────────────────────────────────────────────────
  const loadScores = () => {
    const supabase = createClient();
    setLoadingScores(true);
    supabase
      .from("scores")
      .select("id, title, composer, category, tag, likes_count, views_count, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setScores((data as Score[]) ?? []);
        setLoadingScores(false);
      });
  };

  useEffect(() => {
    if (isAdmin) loadScores();
  }, [isAdmin]);

  // ─── Upload ───────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!user) return;
    if (!title.trim()) { setUploadError("Title is required."); return; }
    if (!pdfFile) { setUploadError("Please select a PDF file."); return; }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const supabase = createClient();
    const pdfPath = `${user.id}/${Date.now()}-${pdfFile.name}`;

    const { error: storageErr } = await supabase.storage
      .from("score-files")
      .upload(pdfPath, pdfFile);

    if (storageErr) {
      setUploadError(`Storage error: ${storageErr.message}`);
      setUploading(false);
      return;
    }

    const { error: dbErr } = await supabase.from("scores").insert({
      title: title.trim(),
      composer: composer.trim(),
      publisher: publisher.trim(),
      description: description.trim(),
      difficulty,
      category,
      instruments: instruments.split(",").map(s => s.trim()).filter(Boolean),
      tag,
      price_display: tag === "premium" && priceDisplay ? priceDisplay.trim() : null,
      pages,
      pdf_url: pdfPath,
      author_id: user.id,
    });

    setUploading(false);

    if (dbErr) {
      setUploadError(`Database error: ${dbErr.message}`);
      return;
    }

    // Reset form
    setTitle(""); setComposer(""); setPublisher(""); setDescription("");
    setDifficulty("Intermediate"); setCategory("piano"); setInstruments("");
    setTag("free"); setPriceDisplay(""); setPages(1); setPdfFile(null);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 4000);
    loadScores();
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (scoreId: string) => {
    if (!confirm("Delete this score? This cannot be undone.")) return;
    setDeletingId(scoreId);
    const supabase = createClient();
    await supabase.from("scores").delete().eq("id", scoreId);
    setDeletingId(null);
    loadScores();
  };

  // ─── Guard: loading ────────────────────────────────────────────────────────
  if (authLoading || checkingAdmin) {
    return (
      <main style={{ minHeight: "100vh", background: "#211817", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#a89690", fontSize: "14px" }}>Loading…</p>
      </main>
    );
  }

  // ─── Guard: not logged in — show inline login form ────────────────────────
  if (!user) {
    return (
      <main style={{ minHeight: "100vh", background: "#211817", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "360px", padding: "40px 32px", background: "#1a1210", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: "11px", color: "#6b5452", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>Admin</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#fff", fontWeight: 400, marginBottom: "28px" }}>Sign in</h1>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const supabase = createClient();
              const { error } = await supabase.auth.signInWithPassword({
                email: fd.get("email") as string,
                password: fd.get("password") as string,
              });
              if (error) alert(error.message);
            }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input name="email" type="email" placeholder="Email" required style={{ ...inputStyle }} />
            <input name="password" type="password" placeholder="Password" required style={{ ...inputStyle }} />
            <button type="submit" style={{ padding: "11px", borderRadius: "8px", background: "#c0392b", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none", marginTop: "4px" }}>
              Sign in
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ─── Guard: not admin ─────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <main style={{ minHeight: "100vh", background: "#211817", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#a89690", fontSize: "15px" }}>Access denied.</p>
      </main>
    );
  }

  // ─── Admin UI ─────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", background: "#211817", padding: "48px 32px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", color: "#6b5452", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
            Admin · MayyaScoreSynth
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "32px", color: "#fff", fontWeight: 400 }}>
            Score Manager
          </h1>
        </div>

        {/* Two-column layout: form left, list right */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>

          {/* ── Upload Form ── */}
          <div style={{ background: "#1e1513", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#fff", fontWeight: 400, marginBottom: "20px" }}>
              Add score
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input type="text" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
              <input type="text" placeholder="Composer" value={composer} onChange={e => setComposer(e.target.value)} style={inputStyle} />
              <input type="text" placeholder="Publisher" value={publisher} onChange={e => setPublisher(e.target.value)} style={inputStyle} />
              <textarea
                placeholder="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} style={{ background: "#1e1513" }}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {DIFFICULTIES.map(d => (
                    <option key={d} value={d} style={{ background: "#1e1513" }}>{d}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Instruments (comma-separated)"
                value={instruments}
                onChange={e => setInstruments(e.target.value)}
                style={inputStyle}
              />

              {/* Tag + price */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "#a89690" }}>
                  <input type="radio" checked={tag === "free"} onChange={() => setTag("free")} style={{ accentColor: "#c0392b" }} /> Free
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "#a89690" }}>
                  <input type="radio" checked={tag === "premium"} onChange={() => setTag("premium")} style={{ accentColor: "#c0392b" }} /> Premium
                </label>
                {tag === "premium" && (
                  <input
                    type="text"
                    placeholder="Price (e.g. €4.99)"
                    value={priceDisplay}
                    onChange={e => setPriceDisplay(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                )}
              </div>

              {/* Pages */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <label style={{ fontSize: "13px", color: "#a89690", flexShrink: 0 }}>Pages</label>
                <input
                  type="number"
                  min={1}
                  value={pages}
                  onChange={e => setPages(Number(e.target.value))}
                  style={{ ...inputStyle, width: "80px" }}
                />
              </div>

              {/* PDF picker */}
              <div>
                <label style={{ fontSize: "12px", color: "#6b5452", marginBottom: "6px", display: "block" }}>PDF File *</label>
                <label style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
                  background: "#2a1f1e", border: "1px dashed rgba(255,255,255,0.15)",
                  fontSize: "13px", color: pdfFile ? "#e8dbd8" : "#6b5452",
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {pdfFile ? pdfFile.name : "Choose PDF…"}
                  <input
                    type="file"
                    accept=".pdf"
                    style={{ display: "none" }}
                    onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>

            {uploadError && (
              <p style={{ fontSize: "12px", color: "#c0392b", marginTop: "10px" }}>{uploadError}</p>
            )}
            {uploadSuccess && (
              <p style={{ fontSize: "12px", color: "#4caf50", marginTop: "10px" }}>Score published successfully!</p>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                width: "100%", marginTop: "16px", padding: "12px", borderRadius: "10px",
                background: "#fff", color: "#211817", fontSize: "13px", fontWeight: 600,
                cursor: uploading ? "not-allowed" : "pointer", border: "none",
                opacity: uploading ? 0.7 : 1, transition: "opacity 0.15s",
              }}
            >
              {uploading ? "Uploading…" : "Publish score"}
            </button>
          </div>

          {/* ── Score List ── */}
          <div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#fff", fontWeight: 400, marginBottom: "20px" }}>
              Published ({scores.length})
            </h2>

            {loadingScores ? (
              <p style={{ fontSize: "13px", color: "#6b5452" }}>Loading…</p>
            ) : scores.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#6b5452" }}>No scores yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {scores.map(s => (
                  <div
                    key={s.id}
                    style={{
                      background: "#1e1513", borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.07)",
                      padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: "12px",
                    }}
                  >
                    {/* Category pill */}
                    <span style={{
                      fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                      background: "rgba(255,255,255,0.06)", color: "#a89690",
                      flexShrink: 0, textTransform: "capitalize",
                    }}>
                      {s.category}
                    </span>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", color: "#e8dbd8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.title}
                      </p>
                      <p style={{ fontSize: "11px", color: "#6b5452", marginTop: "2px" }}>
                        {s.composer || "—"} · {s.tag === "premium" ? "premium" : "free"} · {s.likes_count} ♥ · {s.views_count} views
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(s.id as string)}
                      disabled={deletingId === s.id}
                      title="Delete score"
                      style={{
                        padding: "6px 10px", borderRadius: "6px",
                        background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.25)",
                        color: "#c0392b", fontSize: "12px", cursor: deletingId === s.id ? "not-allowed" : "pointer",
                        flexShrink: 0, transition: "opacity 0.15s",
                        opacity: deletingId === s.id ? 0.5 : 1,
                      }}
                    >
                      {deletingId === s.id ? "…" : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
