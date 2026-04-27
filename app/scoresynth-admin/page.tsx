"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import type { Score } from "@/lib/supabase/types";

// Generate a JPEG thumbnail from page 1 of a PDF File
async function generatePdfThumbnail(file: File): Promise<Blob | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

    return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.88));
  } catch {
    return null;
  }
}

// ─── admin handle ────────────────────────────────────────────────────────────
// Change this if you rename the account
const ADMIN_HANDLE = "mayyascoresynth";

const CATEGORIES = ["piano", "strings", "woodwinds", "brass", "chamber", "symphonic", "guitar", "choir", "percussion", "soundtracks", "big-band"];
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

type BulkItem = {
  filename: string;
  title: string;
  composer?: string;
  publisher?: string;
  description?: string;
  category: string;
  difficulty: string;
  instruments?: string;
  tag: "free" | "premium";
  price_display?: string;
  pages?: number;
};

async function parseMetadataFile(file: File): Promise<BulkItem[]> {
  const text = await file.text();
  if (file.name.endsWith(".json")) {
    return JSON.parse(text) as BulkItem[];
  }
  // CSV: first line = headers, rest = data rows
  const [headerLine, ...rows] = text.trim().split("\n");
  const headers = headerLine.split(",").map(h => h.trim());
  return rows
    .filter(r => r.trim())
    .map(row => {
      const vals = row.split(",").map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
      return {
        filename: obj.filename,
        title: obj.title,
        composer: obj.composer || undefined,
        publisher: obj.publisher || undefined,
        description: obj.description || undefined,
        category: CATEGORIES.includes(obj.category) ? obj.category : "piano",
        difficulty: DIFFICULTIES.includes(obj.difficulty) ? obj.difficulty : "Intermediate",
        instruments: obj.instruments || undefined,
        tag: obj.tag === "premium" ? "premium" : "free",
        price_display: obj.price_display || undefined,
        pages: obj.pages ? Number(obj.pages) : 1,
      } as BulkItem;
    });
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Mode toggle
  const [mode, setMode] = useState<"single" | "bulk">("single");

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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfThumbnail, setPdfThumbnail] = useState<Blob | null>(null);
  const [pdfThumbnailUrl, setPdfThumbnailUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Score list state
  const [scores, setScores] = useState<Score[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPdfUrl, setEditingPdfUrl] = useState<string | null>(null);
  const [editingCoverUrl, setEditingCoverUrl] = useState<string | null>(null);

  // Bulk upload state
  const [bulkMetaFile, setBulkMetaFile] = useState<File | null>(null);
  const [bulkPdfFiles, setBulkPdfFiles] = useState<File[]>([]);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [bulkProgress, setBulkProgress] = useState<{
    total: number; done: number; current: string; errors: string[];
  } | null>(null);
  const [bulkDone, setBulkDone] = useState(false);
  const [bulkConflict, setBulkConflict] = useState<{
    filename: string; title: string; existingId: string;
    resolve: (action: "replace" | "skip") => void;
  } | null>(null);

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
    const ts = Date.now();
    const pdfPath = `${user.id}/${ts}-${pdfFile.name}`;

    const { error: storageErr } = await supabase.storage
      .from("score-files")
      .upload(pdfPath, pdfFile);

    if (storageErr) {
      setUploadError(`Storage error: ${storageErr.message}`);
      setUploading(false);
      return;
    }

    // Upload cover image (explicit or auto-generated from PDF page 1)
    let coverPublicUrl: string | null = null;
    const coverBlob = coverFile ?? pdfThumbnail;
    const coverName = coverFile ? coverFile.name : "cover.jpg";
    if (coverBlob) {
      const coverPath = `${user.id}/${ts}-${coverName}`;
      const { error: coverErr } = await supabase.storage.from("covers").upload(coverPath, coverBlob);
      if (!coverErr) {
        const { data: urlData } = supabase.storage.from("covers").getPublicUrl(coverPath);
        coverPublicUrl = urlData.publicUrl;
      }
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
      cover_url: coverPublicUrl,
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
    setTag("free"); setPriceDisplay(""); setPages(1); setPdfFile(null); setCoverFile(null);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 4000);
    loadScores();
  };

  // ─── Start Edit ───────────────────────────────────────────────────────────
  const startEdit = (s: Score) => {
    setEditingId(s.id as string);
    setEditingPdfUrl(s.pdf_url ?? null);
    setEditingCoverUrl(s.cover_url ?? null);
    setTitle(s.title);
    setComposer(s.composer ?? "");
    setPublisher(s.publisher ?? "");
    setDescription(s.description ?? "");
    setDifficulty(s.difficulty ?? "Intermediate");
    setCategory(s.category ?? "piano");
    setInstruments((s.instruments ?? []).join(", "));
    setTag((s.tag as "free" | "premium") ?? "free");
    setPriceDisplay(s.price_display ?? "");
    setPages(s.pages ?? 1);
    setPdfFile(null);
    setCoverFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null); setEditingPdfUrl(null); setEditingCoverUrl(null);
    setTitle(""); setComposer(""); setPublisher(""); setDescription("");
    setDifficulty("Intermediate"); setCategory("piano"); setInstruments("");
    setTag("free"); setPriceDisplay(""); setPages(1);
    setPdfFile(null); setCoverFile(null); setPdfThumbnail(null); setPdfThumbnailUrl(null);
  };

  // ─── Update ───────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!user || !editingId) return;
    if (!title.trim()) { setUploadError("Title is required."); return; }

    setUploading(true);
    setUploadError(null);
    const supabase = createClient();
    const ts = Date.now();

    let newPdfUrl = editingPdfUrl;
    if (pdfFile) {
      const pdfPath = `${user.id}/${ts}-${pdfFile.name}`;
      const { error: storageErr } = await supabase.storage.from("score-files").upload(pdfPath, pdfFile);
      if (storageErr) { setUploadError(`Storage error: ${storageErr.message}`); setUploading(false); return; }
      newPdfUrl = pdfPath;
    }

    let newCoverUrl = editingCoverUrl;
    const updateCoverBlob = coverFile ?? (pdfThumbnail && !editingCoverUrl ? pdfThumbnail : null);
    const updateCoverName = coverFile ? coverFile.name : "cover.jpg";
    if (updateCoverBlob) {
      const coverPath = `${user.id}/${ts}-${updateCoverName}`;
      const { error: coverErr } = await supabase.storage.from("covers").upload(coverPath, updateCoverBlob);
      if (!coverErr) {
        const { data: urlData } = supabase.storage.from("covers").getPublicUrl(coverPath);
        newCoverUrl = urlData.publicUrl;
      }
    }

    const { error: dbErr } = await supabase.from("scores").update({
      title: title.trim(), composer: composer.trim(), publisher: publisher.trim(),
      description: description.trim(), difficulty, category,
      instruments: instruments.split(",").map(s => s.trim()).filter(Boolean),
      tag, price_display: tag === "premium" && priceDisplay ? priceDisplay.trim() : null,
      pages, pdf_url: newPdfUrl, cover_url: newCoverUrl,
      updated_at: new Date().toISOString(),
    }).eq("id", editingId);

    setUploading(false);
    if (dbErr) { setUploadError(`Database error: ${dbErr.message}`); return; }

    cancelEdit();
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

  // ─── Bulk Upload ──────────────────────────────────────────────────────────
  const runBulkUpload = async () => {
    if (!user || bulkItems.length === 0) return;
    const supabase = createClient();
    setBulkProgress({ total: bulkItems.length, done: 0, current: "", errors: [] });
    setBulkDone(false);
    const errors: string[] = [];

    for (let i = 0; i < bulkItems.length; i++) {
      const item = bulkItems[i];
      setBulkProgress(p => ({ ...p!, done: i, current: item.title }));

      const pdf = bulkPdfFiles.find(f => f.name === item.filename);
      if (!pdf) {
        errors.push(`${item.filename}: PDF not found`);
        continue;
      }

      // ── Check for existing score with same filename ───────────────────────
      const { data: existing } = await supabase
        .from("scores")
        .select("id, title")
        .ilike("pdf_url", `%${item.filename}%`)
        .maybeSingle();

      let action: "insert" | "replace" | "skip" = "insert";

      if (existing) {
        // Pause and ask user
        action = await new Promise<"replace" | "skip">(resolve => {
          setBulkConflict({
            filename: item.filename,
            title: item.title,
            existingId: existing.id,
            resolve,
          });
        });
        setBulkConflict(null);
        if (action === "skip") continue;
      }

      const ts = Date.now() + i;
      const pdfPath = `${user.id}/${ts}-${pdf.name}`;
      const { error: storageErr } = await supabase.storage
        .from("score-files").upload(pdfPath, pdf);
      if (storageErr) { errors.push(`${item.filename}: ${storageErr.message}`); continue; }

      let coverUrl: string | null = null;
      const thumb = await generatePdfThumbnail(pdf);
      if (thumb) {
        const coverPath = `${user.id}/${ts}-cover.jpg`;
        const { error: coverErr } = await supabase.storage
          .from("covers").upload(coverPath, thumb);
        if (!coverErr) {
          const { data } = supabase.storage.from("covers").getPublicUrl(coverPath);
          coverUrl = data.publicUrl;
        }
      }

      const scoreData = {
        title: item.title,
        composer: item.composer ?? "",
        publisher: item.publisher ?? "",
        description: item.description ?? "",
        difficulty: item.difficulty,
        category: item.category,
        instruments: item.instruments?.split(",").map(s => s.trim()).filter(Boolean) ?? [],
        tag: item.tag,
        price_display: item.tag === "premium" ? (item.price_display ?? null) : null,
        pages: item.pages ?? 1,
        pdf_url: pdfPath,
        cover_url: coverUrl,
        author_id: user.id,
      };

      if (action === "replace" && existing) {
        const { error: dbErr } = await supabase.from("scores").update(scoreData).eq("id", existing.id);
        if (dbErr) errors.push(`${item.filename}: DB — ${dbErr.message}`);
      } else {
        const { error: dbErr } = await supabase.from("scores").insert(scoreData);
        if (dbErr) errors.push(`${item.filename}: DB — ${dbErr.message}`);
      }
    }

    setBulkProgress({ total: bulkItems.length, done: bulkItems.length, current: "", errors });
    setBulkDone(true);
    loadScores();
  };

  const resetBulk = () => {
    setBulkMetaFile(null);
    setBulkPdfFiles([]);
    setBulkItems([]);
    setBulkProgress(null);
    setBulkDone(false);
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

  const bulkRunning = bulkProgress !== null && !bulkDone;
  const bulkSuccessCount = bulkDone && bulkProgress
    ? bulkProgress.total - bulkProgress.errors.length
    : 0;

  // ─── Admin UI ─────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", background: "#211817", padding: "48px 32px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", color: "#6b5452", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
            Admin · MayyaScoreSynth
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "32px", color: "#fff", fontWeight: 400 }}>
            Score Manager
          </h1>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
          {(["single", "bulk"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                cursor: "pointer", border: "1px solid",
                borderColor: mode === m ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                background: mode === m ? "rgba(255,255,255,0.08)" : "transparent",
                color: mode === m ? "#fff" : "#6b5452",
                transition: "all 0.15s",
              }}
            >
              {m === "single" ? "Single upload" : "Bulk upload"}
            </button>
          ))}
        </div>

        {/* Two-column layout: form left, list right */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>

          {/* ── Left column ── */}
          {mode === "single" ? (
            /* ── Single Upload Form ── */
            <div style={{ background: "#1e1513", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#fff", fontWeight: 400 }}>
                  {editingId ? "Edit score" : "Add score"}
                </h2>
                {editingId && (
                  <button onClick={cancelEdit} style={{ fontSize: "12px", color: "#6b5452", background: "none", border: "none", cursor: "pointer" }}>
                    Cancel
                  </button>
                )}
              </div>

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

                {/* Cover image picker */}
                <div>
                  <label style={{ fontSize: "12px", color: "#6b5452", marginBottom: "6px", display: "block" }}>Cover Image (PNG/JPG)</label>
                  <label style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
                    background: "#2a1f1e", border: "1px dashed rgba(255,255,255,0.15)",
                    fontSize: "13px", color: coverFile ? "#e8dbd8" : "#6b5452",
                  }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    {coverFile ? coverFile.name : "Choose image…"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={e => setCoverFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {coverFile && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={URL.createObjectURL(coverFile)}
                      alt="Cover preview"
                      style={{ marginTop: "8px", width: "100%", borderRadius: "8px", maxHeight: "160px", objectFit: "cover" }}
                    />
                  )}
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
                      onChange={async e => {
                        const f = e.target.files?.[0] ?? null;
                        setPdfFile(f);
                        setPdfThumbnail(null);
                        setPdfThumbnailUrl(null);
                        if (f) {
                          const thumb = await generatePdfThumbnail(f);
                          if (thumb) {
                            setPdfThumbnail(thumb);
                            setPdfThumbnailUrl(URL.createObjectURL(thumb));
                          }
                        }
                      }}
                    />
                  </label>
                  {/* Show auto-generated PDF thumbnail */}
                  {pdfThumbnailUrl && !coverFile && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pdfThumbnailUrl}
                      alt="PDF preview"
                      style={{ marginTop: "8px", width: "100%", borderRadius: "8px", maxHeight: "160px", objectFit: "cover" }}
                    />
                  )}
                </div>
              </div>

              {uploadError && (
                <p style={{ fontSize: "12px", color: "#c0392b", marginTop: "10px" }}>{uploadError}</p>
              )}
              {uploadSuccess && (
                <p style={{ fontSize: "12px", color: "#4caf50", marginTop: "10px" }}>Score published successfully!</p>
              )}

              <button
                onClick={editingId ? handleUpdate : handleUpload}
                disabled={uploading}
                style={{
                  width: "100%", marginTop: "16px", padding: "12px", borderRadius: "10px",
                  background: "#fff", color: "#211817", fontSize: "13px", fontWeight: 600,
                  cursor: uploading ? "not-allowed" : "pointer", border: "none",
                  opacity: uploading ? 0.7 : 1, transition: "opacity 0.15s",
                }}
              >
                {uploading ? "Saving…" : editingId ? "Save changes" : "Publish score"}
              </button>
            </div>
          ) : (
            /* ── Bulk Upload Panel ── */
            <div style={{ background: "#1e1513", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)", padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#fff", fontWeight: 400, margin: 0 }}>
                Bulk upload
              </h2>

              {/* Step 1: Metadata file */}
              <div>
                <label style={{ fontSize: "12px", color: "#6b5452", marginBottom: "6px", display: "block" }}>
                  Step 1 — Metadata file (CSV or JSON)
                </label>
                <label style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
                  background: "#2a1f1e", border: "1px dashed rgba(255,255,255,0.15)",
                  fontSize: "13px", color: bulkMetaFile ? "#e8dbd8" : "#6b5452",
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {bulkMetaFile ? bulkMetaFile.name : "Choose CSV or JSON…"}
                  <input
                    type="file"
                    accept=".csv,.json"
                    style={{ display: "none" }}
                    onChange={async e => {
                      const f = e.target.files?.[0] ?? null;
                      setBulkMetaFile(f);
                      setBulkItems([]);
                      if (f) {
                        try {
                          const items = await parseMetadataFile(f);
                          setBulkItems(items);
                        } catch {
                          setBulkItems([]);
                        }
                      }
                    }}
                  />
                </label>
                {/* CSV format hint */}
                <p style={{ fontSize: "10px", color: "#3d2d2b", marginTop: "6px", fontFamily: "monospace", wordBreak: "break-all" }}>
                  filename,title,composer,publisher,description,category,difficulty,instruments,tag,price_display,pages
                </p>
              </div>

              {/* Step 2: PDF files */}
              <div>
                <label style={{ fontSize: "12px", color: "#6b5452", marginBottom: "6px", display: "block" }}>
                  Step 2 — PDF files (select all at once)
                </label>
                <label style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
                  background: "#2a1f1e", border: "1px dashed rgba(255,255,255,0.15)",
                  fontSize: "13px", color: bulkPdfFiles.length > 0 ? "#e8dbd8" : "#6b5452",
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {bulkPdfFiles.length > 0 ? `${bulkPdfFiles.length} PDF${bulkPdfFiles.length !== 1 ? "s" : ""} selected` : "Choose PDFs…"}
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    style={{ display: "none" }}
                    onChange={e => setBulkPdfFiles(Array.from(e.target.files ?? []))}
                  />
                </label>
              </div>

              {/* Preview table */}
              {bulkItems.length > 0 && (
                <div>
                  <p style={{ fontSize: "12px", color: "#6b5452", marginBottom: "8px" }}>
                    Preview — {bulkItems.length} score{bulkItems.length !== 1 ? "s" : ""}
                  </p>
                  <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                          {["File", "Title", "Category", "Difficulty", "Tag"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#6b5452", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkItems.slice(0, 8).map((item, i) => (
                          <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "7px 10px", color: "#6b5452", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.filename}</td>
                            <td style={{ padding: "7px 10px", color: "#e8dbd8", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</td>
                            <td style={{ padding: "7px 10px", color: "#a89690", textTransform: "capitalize" }}>{item.category}</td>
                            <td style={{ padding: "7px 10px", color: "#a89690" }}>{item.difficulty}</td>
                            <td style={{ padding: "7px 10px", color: item.tag === "premium" ? "#c0392b" : "#4caf50" }}>{item.tag}</td>
                          </tr>
                        ))}
                        {bulkItems.length > 8 && (
                          <tr style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <td colSpan={5} style={{ padding: "7px 10px", color: "#3d2d2b", fontSize: "11px" }}>
                              + {bulkItems.length - 8} more…
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {bulkProgress && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#a89690", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                      {bulkDone ? (bulkProgress.errors.length === 0 ? "Done!" : "Finished with errors") : bulkProgress.current}
                    </span>
                    <span style={{ fontSize: "12px", color: "#6b5452", flexShrink: 0 }}>
                      {bulkProgress.done} / {bulkProgress.total}
                    </span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "2px",
                      background: bulkDone && bulkProgress.errors.length === 0 ? "#4caf50" : "#c0392b",
                      width: `${(bulkProgress.done / bulkProgress.total) * 100}%`,
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                  {bulkDone && (
                    <p style={{ fontSize: "12px", marginTop: "8px", color: "#4caf50" }}>
                      {bulkSuccessCount} uploaded successfully{bulkProgress.errors.length > 0 ? ` · ${bulkProgress.errors.length} error${bulkProgress.errors.length !== 1 ? "s" : ""}` : ""}
                    </p>
                  )}
                  {bulkProgress.errors.length > 0 && (
                    <ul style={{ margin: "6px 0 0", padding: "0 0 0 14px" }}>
                      {bulkProgress.errors.map((e, i) => (
                        <li key={i} style={{ fontSize: "11px", color: "#c0392b" }}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Conflict dialog */}
              {bulkConflict && (
                <div style={{
                  background: "#2a1f1e", border: "1px solid rgba(192,57,43,0.4)",
                  borderRadius: "10px", padding: "14px 16px",
                }}>
                  <p style={{ fontSize: "12px", color: "#e8dbd8", marginBottom: "4px", fontWeight: 500 }}>
                    Файл уже существует
                  </p>
                  <p style={{ fontSize: "11px", color: "#6b5452", marginBottom: "12px" }}>
                    <span style={{ color: "#a89690" }}>{bulkConflict.filename}</span> уже загружен как «{bulkConflict.title}»
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => bulkConflict.resolve("replace")}
                      style={{
                        flex: 1, padding: "8px", borderRadius: "7px",
                        background: "#c0392b", color: "#fff",
                        fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer",
                      }}
                    >
                      Заменить
                    </button>
                    <button
                      onClick={() => bulkConflict.resolve("skip")}
                      style={{
                        flex: 1, padding: "8px", borderRadius: "7px",
                        background: "rgba(255,255,255,0.07)", color: "#a89690",
                        fontSize: "12px", fontWeight: 500,
                        border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                      }}
                    >
                      Пропустить
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={runBulkUpload}
                  disabled={bulkItems.length === 0 || bulkRunning}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "10px",
                    background: "#fff", color: "#211817", fontSize: "13px", fontWeight: 600,
                    cursor: (bulkItems.length === 0 || bulkRunning) ? "not-allowed" : "pointer",
                    border: "none", opacity: (bulkItems.length === 0 || bulkRunning) ? 0.5 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {bulkRunning ? "Uploading…" : `Upload ${bulkItems.length > 0 ? bulkItems.length + " " : ""}score${bulkItems.length !== 1 ? "s" : ""}`}
                </button>
                {(bulkMetaFile || bulkPdfFiles.length > 0 || bulkDone) && (
                  <button
                    onClick={resetBulk}
                    disabled={bulkRunning}
                    style={{
                      padding: "12px 16px", borderRadius: "10px",
                      background: "transparent", color: "#6b5452", fontSize: "13px",
                      cursor: bulkRunning ? "not-allowed" : "pointer",
                      border: "1px solid rgba(255,255,255,0.08)", opacity: bulkRunning ? 0.5 : 1,
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

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

                    {/* Edit */}
                    <button
                      onClick={() => { startEdit(s); setMode("single"); }}
                      title="Edit score"
                      style={{
                        padding: "6px 10px", borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#a89690", fontSize: "12px", cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      Edit
                    </button>

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
