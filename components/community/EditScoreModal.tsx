"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Score } from "@/lib/supabase/types";

async function generatePdfThumbnail(file: File): Promise<Blob | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs", import.meta.url
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

const CATEGORIES = ["piano", "strings", "woodwinds", "brass", "chamber", "symphonic", "guitar", "choir", "percussion", "soundtracks"];
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

type Props = {
  score: Score;
  onClose: () => void;
  onSuccess: (updated: Score) => void;
};

export default function EditScoreModal({ score, onClose, onSuccess }: Props) {
  const [title,       setTitle]       = useState(score.title);
  const [composer,    setComposer]    = useState(score.composer ?? "");
  const [publisher,   setPublisher]   = useState(score.publisher ?? "");
  const [description, setDescription] = useState(score.description ?? "");
  const [category,    setCategory]    = useState(score.category ?? "piano");
  const [difficulty,  setDifficulty]  = useState(score.difficulty ?? "Intermediate");
  const [instruments, setInstruments] = useState((score.instruments ?? []).join(", "));
  const [tag,         setTag]         = useState<"free" | "premium">((score.tag as "free" | "premium") ?? "free");
  const [priceDisplay, setPriceDisplay] = useState(score.price_display ?? "");
  const [coverFile,   setCoverFile]   = useState<File | null>(null);
  const [pdfFile,     setPdfFile]     = useState<File | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated."); setSaving(false); return; }

    let coverUrl = score.cover_url ?? null;
    let pdfUrl   = score.pdf_url   ?? null;

    // Upload new PDF if provided
    if (pdfFile) {
      const pdfPath = `${user.id}/${Date.now()}-${pdfFile.name}`;
      const { error: pdfErr } = await supabase.storage
        .from("score-files")
        .upload(pdfPath, pdfFile);
      if (pdfErr) { setError(`PDF upload failed: ${pdfErr.message}`); setSaving(false); return; }
      pdfUrl = pdfPath;
    }

    // Upload cover: manual choice takes priority, otherwise auto-generate from new PDF
    const coverSource = coverFile ?? (pdfFile ? await generatePdfThumbnail(pdfFile) : null);
    if (coverSource) {
      const ext = coverFile ? (coverFile.name.split(".").pop() ?? "jpg") : "jpg";
      const coverPath = `${user.id}/${Date.now()}-cover.${ext}`;
      const { error: coverErr } = await supabase.storage
        .from("avatars")
        .upload(coverPath, coverSource);
      if (!coverErr) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(coverPath);
        coverUrl = data.publicUrl;
      }
    }

    const updates = {
      title:         title.trim(),
      composer:      composer.trim(),
      publisher:     publisher.trim(),
      description:   description.trim(),
      category,
      difficulty,
      instruments:   instruments.split(",").map(s => s.trim()).filter(Boolean),
      tag,
      price_display: tag === "premium" && priceDisplay ? priceDisplay.trim() : null,
      cover_url:     coverUrl,
      pdf_url:       pdfUrl,
      updated_at:    new Date().toISOString(),
    };

    const { data, error: dbErr } = await supabase
      .from("scores")
      .update(updates)
      .eq("id", score.id as string)
      .select()
      .single();

    setSaving(false);

    if (dbErr) { setError(dbErr.message); return; }

    onSuccess(data as Score);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", overflowY: "auto",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#2a1f1e", borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "32px", width: "100%", maxWidth: "480px",
          display: "flex", flexDirection: "column", gap: "12px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#fff", fontWeight: 400 }}>
            Edit score
          </h2>
          <button
            onClick={onClose}
            style={{ color: "#6b5452", fontSize: "20px", lineHeight: 1, padding: "4px", cursor: "pointer", background: "none", border: "none" }}
          >
            ×
          </button>
        </div>

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

        {/* Tag */}
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
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

        {/* Cover image */}
        <div>
          <label style={{ fontSize: "12px", color: "#6b5452", marginBottom: "6px", display: "block" }}>
            Cover image {score.cover_url ? "(replace)" : "(upload)"}
          </label>
          {score.cover_url && !coverFile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={score.cover_url}
              alt="Current cover"
              style={{ width: "100%", borderRadius: "8px", maxHeight: "140px", objectFit: "cover", marginBottom: "8px" }}
            />
          )}
          <label style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
            background: "#1e1513", border: "1px dashed rgba(255,255,255,0.15)",
            fontSize: "13px", color: coverFile ? "#e8dbd8" : "#6b5452",
          }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            {coverFile ? coverFile.name : "Choose new cover…"}
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
              alt="New cover preview"
              style={{ marginTop: "8px", width: "100%", borderRadius: "8px", maxHeight: "140px", objectFit: "cover" }}
            />
          )}
        </div>

        {/* PDF file */}
        <div>
          <label style={{ fontSize: "12px", color: "#6b5452", marginBottom: "6px", display: "block" }}>
            Sheet music PDF {score.pdf_url ? "(replace)" : "(upload)"}
          </label>
          {score.pdf_url && !pdfFile && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 12px", borderRadius: "8px", marginBottom: "8px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              fontSize: "12px", color: "#8a7270",
            }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              Current file uploaded
            </div>
          )}
          <label style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
            background: "#1e1513",
            border: pdfFile ? "1px solid rgba(200,169,126,0.4)" : "1px dashed rgba(255,255,255,0.15)",
            fontSize: "13px", color: pdfFile ? "#c8a97e" : "#6b5452",
          }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {pdfFile ? pdfFile.name : "Choose new PDF…"}
            <input
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
            />
            {pdfFile && (
              <button
                type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); setPdfFile(null); }}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "#6b5452", cursor: "pointer", padding: "0", fontSize: "16px", lineHeight: 1 }}
              >×</button>
            )}
          </label>
        </div>

        {error && <p style={{ fontSize: "12px", color: "#c0392b" }}>{error}</p>}

        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: "12px", borderRadius: "10px",
              background: "#fff", color: "#211817", fontSize: "13px", fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer", border: "none",
              opacity: saving ? 0.7 : 1, transition: "opacity 0.15s",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "12px 18px", borderRadius: "10px",
              background: "transparent", color: "#6b5452", fontSize: "13px",
              cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
