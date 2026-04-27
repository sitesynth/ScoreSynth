"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Score } from "@/lib/supabase/types";
import { processPdfForUpload } from "@/lib/pdf-processor";

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

const CATEGORIES = ["piano", "strings", "woodwinds", "brass", "guitar", "percussion", "choir", "chamber", "symphonic", "jazz", "soundtracks"];
const CATEGORY_LABELS: Record<string, string> = {
  piano:       "Piano & Keyboard",
  strings:     "Strings",
  woodwinds:   "Woodwinds",
  brass:       "Brass",
  guitar:      "Guitar",
  percussion:  "Percussion",
  choir:       "Vocal & Choir",
  chamber:     "Chamber Music",
  symphonic:   "Orchestra",
  jazz:        "Jazz & Big Band",
  soundtracks: "Soundtracks",
};
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
  const [pages,       setPages]       = useState<string>(score.pages ? String(score.pages) : "");
  const [coverFile,   setCoverFile]   = useState<File | null>(null);
  const [pdfFile,     setPdfFile]     = useState<File | null>(null);
  const [audioFile,   setAudioFile]   = useState<File | null>(null);
  // Existing parts (from DB) that haven't been removed
  const [existingParts, setExistingParts] = useState<{ name: string; pdf_url: string }[]>(score.parts ?? []);
  // New parts being added
  const [newParts, setNewParts] = useState<{ name: string; file: File | null }[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [coverDrag,   setCoverDrag]   = useState(false);
  const [pdfDrag,     setPdfDrag]     = useState(false);
  const [audioDrag,   setAudioDrag]   = useState(false);
  const [newPartDragIndex, setNewPartDragIndex] = useState<number | null>(null);
  // Reorder drag state (separate from file-drop drag)
  const [reorderDrag,    setReorderDrag]    = useState<{ list: "existing" | "new"; fromIdx: number } | null>(null);
  const [reorderOverIdx, setReorderOverIdx] = useState<number | null>(null);

  const isPdfFile = (f: File) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");

  const makeDrop = (
    accept: (f: File) => boolean,
    onFile: (f: File) => void,
    setDrag: (v: boolean) => void,
  ) => ({
    onDragOver:  (e: React.DragEvent) => { e.preventDefault(); setDrag(true); },
    onDragLeave: (e: React.DragEvent) => { e.preventDefault(); setDrag(false); },
    onDrop:      (e: React.DragEvent) => {
      e.preventDefault(); setDrag(false);
      const f = e.dataTransfer.files[0];
      if (f && accept(f)) onFile(f);
    },
  });

  const addPart = () => setNewParts(p => [...p, { name: "", file: null }]);
  const removeNewPart = (i: number) => setNewParts(p => p.filter((_, idx) => idx !== i));
  const updateNewPartName = (i: number, name: string) => setNewParts(p => p.map((pt, idx) => idx === i ? { ...pt, name } : pt));
  const updateNewPartFile = (i: number, file: File | null) => setNewParts(p => p.map((pt, idx) => idx === i ? { ...pt, file } : pt));
  const removeExistingPart = (i: number) => setExistingParts(p => p.filter((_, idx) => idx !== i));

  const reorder = <T,>(arr: T[], from: number, to: number): T[] => {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  const handleReorderDrop = (list: "existing" | "new", toIdx: number) => {
    if (!reorderDrag || reorderDrag.list !== list || reorderDrag.fromIdx === toIdx) return;
    if (list === "existing") setExistingParts(p => reorder(p, reorderDrag.fromIdx, toIdx));
    else setNewParts(p => reorder(p, reorderDrag.fromIdx, toIdx));
    setReorderDrag(null);
    setReorderOverIdx(null);
  };

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
      const processedPdf = await processPdfForUpload(pdfFile, title.trim());
      const pdfPath = `${user.id}/${Date.now()}-${pdfFile.name}`;
      const { error: pdfErr } = await supabase.storage
        .from("score-files")
        .upload(pdfPath, processedPdf);
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

    // Upload audio recording if provided
    let audioUrl = score.midi_url ?? null;
    if (audioFile) {
      const ext = audioFile.name.split(".").pop()?.toLowerCase() ?? "mp3";
      const ap = `${user.id}/audio/${Date.now()}.${ext}`;
      const { error: audioErr } = await supabase.storage.from("score-files").upload(ap, audioFile);
      if (audioErr) { setError(`Audio upload failed: ${audioErr.message}`); setSaving(false); return; }
      audioUrl = ap;
    }

    // Upload new parts
    const uploadedNewParts: { name: string; pdf_url: string }[] = [];
    for (const part of newParts) {
      if (!part.name.trim() || !part.file) continue;
      const processedPart = await processPdfForUpload(part.file, `${title.trim()} — ${part.name.trim()}`);
      const ext = part.file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const partPath = `${user.id}/parts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: partErr } = await supabase.storage.from("score-files").upload(partPath, processedPart);
      if (partErr) { setError(`Part upload failed: ${partErr.message}`); setSaving(false); return; }
      uploadedNewParts.push({ name: part.name.trim(), pdf_url: partPath });
    }
    const allParts = [...existingParts, ...uploadedNewParts];

    const updates = {
      title:         title.trim(),
      composer:      composer.trim(),
      publisher:     publisher.trim(),
      description:   description.trim(),
      category,
      difficulty,
      instruments:   instruments.split(",").map(s => s.trim()).filter(Boolean),
      pages:         pages ? parseInt(pages, 10) : null,
      tag,
      price_display: tag === "premium" && priceDisplay ? priceDisplay.trim() : null,
      cover_url:     coverUrl,
      pdf_url:       pdfUrl,
      midi_url:      audioUrl,
      parts:         allParts,
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
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
        overflowY: "auto",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#2a1f1e", borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "32px", width: "100%", maxWidth: "480px",
          display: "flex", flexDirection: "column", gap: "12px",
          margin: "0 auto",
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
                {CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {DIFFICULTIES.map(d => (
              <option key={d} value={d} style={{ background: "#1e1513" }}>{d}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "10px" }}>
          <input
            type="text"
            placeholder="Instruments (comma-separated)"
            value={instruments}
            onChange={e => setInstruments(e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Pages"
            min={1}
            value={pages}
            onChange={e => setPages(e.target.value)}
            style={{ ...inputStyle, appearance: "none" } as React.CSSProperties}
          />
        </div>

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
            <img src={score.cover_url} alt="Current cover"
              style={{ width: "100%", borderRadius: "8px", maxHeight: "140px", objectFit: "cover", marginBottom: "8px" }}
            />
          )}
          <label
            {...makeDrop(f => f.type.startsWith("image/"), setCoverFile, setCoverDrag)}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: coverDrag ? "18px 14px" : "10px 14px", borderRadius: "8px", cursor: "pointer",
              background: coverDrag ? "rgba(255,255,255,0.05)" : "#1e1513",
              border: coverDrag ? "1px dashed rgba(255,255,255,0.4)" : coverFile ? "1px dashed rgba(200,169,126,0.4)" : "1px dashed rgba(255,255,255,0.15)",
              fontSize: "13px", color: coverFile ? "#e8dbd8" : "#6b5452",
              transition: "padding 0.15s, border-color 0.15s, background 0.15s",
              justifyContent: coverDrag ? "center" : undefined,
            }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            {coverDrag ? "Drop image here" : coverFile ? coverFile.name : "Choose or drag image…"}
            <input type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => setCoverFile(e.target.files?.[0] ?? null)} />
          </label>
          {coverFile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={URL.createObjectURL(coverFile)} alt="New cover preview"
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
          <label
            {...makeDrop(isPdfFile, setPdfFile, setPdfDrag)}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: pdfDrag ? "18px 14px" : "10px 14px", borderRadius: "8px", cursor: "pointer",
              background: pdfDrag ? "rgba(255,255,255,0.05)" : "#1e1513",
              border: pdfDrag ? "1px dashed rgba(255,255,255,0.4)" : pdfFile ? "1px solid rgba(200,169,126,0.4)" : "1px dashed rgba(255,255,255,0.15)",
              fontSize: "13px", color: pdfFile ? "#c8a97e" : "#6b5452",
              transition: "padding 0.15s, border-color 0.15s, background 0.15s",
              justifyContent: pdfDrag ? "center" : undefined,
            }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {pdfDrag ? "Drop PDF here" : pdfFile ? pdfFile.name : "Choose or drag PDF…"}
            <input type="file" accept=".pdf" style={{ display: "none" }}
              onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
            {pdfFile && !pdfDrag && (
              <button type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); setPdfFile(null); }}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "#6b5452", cursor: "pointer", padding: "0", fontSize: "16px", lineHeight: 1 }}
              >×</button>
            )}
          </label>
        </div>

        {/* Audio Recording */}
        <div>
          <label style={{ fontSize: "12px", color: "#6b5452", marginBottom: "6px", display: "block" }}>
            Audio Recording {score.midi_url ? "(replace)" : "(optional)"}
          </label>
          {score.midi_url && !audioFile && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 12px", borderRadius: "8px", marginBottom: "8px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              fontSize: "12px", color: "#8a7270",
            }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              Current recording attached
            </div>
          )}
          <label
            {...makeDrop(f => f.type.startsWith("audio/"), setAudioFile, setAudioDrag)}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: audioDrag ? "18px 14px" : "10px 14px", borderRadius: "8px", cursor: "pointer",
              background: audioDrag ? "rgba(255,255,255,0.05)" : "#1e1513",
              border: audioDrag ? "1px dashed rgba(255,255,255,0.4)" : audioFile ? "1px solid rgba(200,169,126,0.4)" : "1px dashed rgba(255,255,255,0.15)",
              fontSize: "13px", color: audioFile ? "#c8a97e" : "#6b5452",
              transition: "padding 0.15s, border-color 0.15s, background 0.15s",
              justifyContent: audioDrag ? "center" : undefined,
            }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {audioDrag ? "Drop audio here" : audioFile ? audioFile.name : "Choose or drag audio…"}
            </span>
            <input type="file" accept="audio/*" style={{ display: "none" }} onChange={e => setAudioFile(e.target.files?.[0] ?? null)} />
            {audioFile && !audioDrag && (
              <button type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); setAudioFile(null); }}
                style={{ background: "none", border: "none", color: "#6b5452", cursor: "pointer", padding: "0", fontSize: "16px", lineHeight: 1 }}
              >×</button>
            )}
          </label>
          {audioFile && (
            <audio controls src={URL.createObjectURL(audioFile)} style={{ width: "100%", marginTop: "8px", height: "36px" }} />
          )}
        </div>

        {/* ── Instrument Parts ── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dbd8", margin: "0 0 3px" }}>Instrument Parts</p>
            <p style={{ fontSize: "11px", color: "#6b5452", margin: 0, lineHeight: 1.5 }}>
              Upload individual parts (Violin I, Cello, Trumpet…) so players can download separately.
            </p>
          </div>

          {/* Existing parts */}
          {existingParts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
              {existingParts.map((part, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => setReorderDrag({ list: "existing", fromIdx: i })}
                  onDragOver={e => { e.preventDefault(); setReorderOverIdx(i); }}
                  onDragLeave={() => setReorderOverIdx(null)}
                  onDrop={() => handleReorderDrop("existing", i)}
                  onDragEnd={() => { setReorderDrag(null); setReorderOverIdx(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: reorderDrag?.list === "existing" && reorderOverIdx === i
                      ? "rgba(192,57,43,0.08)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${reorderDrag?.list === "existing" && reorderOverIdx === i
                      ? "rgba(192,57,43,0.35)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: "10px", padding: "8px 10px",
                    cursor: "grab", transition: "background 0.12s, border-color 0.12s",
                  }}
                >
                  {/* Drag handle */}
                  <svg width="12" height="12" fill="none" stroke="#4a3532" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, cursor: "grab" }}>
                    <line x1="3" y1="8"  x2="21" y2="8"/>
                    <line x1="3" y1="16" x2="21" y2="16"/>
                  </svg>
                  <svg width="12" height="12" fill="none" stroke="#6b5452" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span style={{ flex: 1, fontSize: "12px", color: "#c8b8b6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {part.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExistingPart(i)}
                    title="Remove part"
                    style={{ background: "none", border: "none", color: "#4a3532", cursor: "pointer", padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center", transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#c0392b")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#4a3532")}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New parts being added */}
          {newParts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
              {newParts.map((part, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={e => { if ((e.target as HTMLElement).closest("label")) { e.preventDefault(); return; } setReorderDrag({ list: "new", fromIdx: i }); }}
                  onDragOver={e => { if (reorderDrag?.list === "new") { e.preventDefault(); setReorderOverIdx(i); } }}
                  onDragLeave={() => { if (reorderDrag?.list === "new") setReorderOverIdx(null); }}
                  onDrop={e => { if (reorderDrag?.list === "new") { e.stopPropagation(); handleReorderDrop("new", i); } }}
                  onDragEnd={() => { setReorderDrag(null); setReorderOverIdx(null); }}
                  style={{
                    display: "grid", gridTemplateColumns: "auto 1fr 1fr auto",
                    gap: "8px", alignItems: "center",
                    background: reorderDrag?.list === "new" && reorderOverIdx === i
                      ? "rgba(192,57,43,0.08)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${reorderDrag?.list === "new" && reorderOverIdx === i
                      ? "rgba(192,57,43,0.35)" : "rgba(192,57,43,0.2)"}`,
                    borderRadius: "10px", padding: "8px 10px",
                    transition: "background 0.12s, border-color 0.12s",
                  }}
                >
                  {/* Drag handle */}
                  <svg width="12" height="12" fill="none" stroke="#4a3532" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, cursor: "grab" }}>
                    <line x1="3" y1="8"  x2="21" y2="8"/>
                    <line x1="3" y1="16" x2="21" y2="16"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Name, e.g. Violin I"
                    value={part.name}
                    onChange={e => updateNewPartName(i, e.target.value)}
                    style={{ ...inputStyle, padding: "7px 10px", fontSize: "12px", background: "rgba(255,255,255,0.05)" }}
                  />
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNewPartDragIndex(i);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                        setNewPartDragIndex(prev => (prev === i ? null : prev));
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNewPartDragIndex(null);
                      const file = e.dataTransfer.files[0];
                      if (file && isPdfFile(file)) {
                        updateNewPartFile(i, file);
                      }
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: newPartDragIndex === i ? "14px 10px" : "7px 10px",
                      borderRadius: "8px", cursor: "pointer",
                      background: newPartDragIndex === i ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                      border: newPartDragIndex === i
                        ? "1px dashed rgba(255,255,255,0.4)"
                        : "1px dashed rgba(255,255,255,0.1)",
                      fontSize: "12px", color: part.file ? "#c8a97e" : "#6b5452", overflow: "hidden",
                      transition: "padding 0.15s, border-color 0.15s, background 0.15s",
                      justifyContent: newPartDragIndex === i ? "center" : undefined,
                    }}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {newPartDragIndex === i ? "Drop PDF here" : part.file ? part.file.name : "Choose or drag PDF…"}
                    </span>
                    <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => updateNewPartFile(i, e.target.files?.[0] ?? null)} />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeNewPart(i)}
                    style={{ background: "none", border: "none", color: "#4a3532", cursor: "pointer", padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center", transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#c0392b")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#4a3532")}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add part button */}
          {existingParts.length === 0 && newParts.length === 0 ? (
            <button
              type="button"
              onClick={addPart}
              style={{
                width: "100%", padding: "14px", borderRadius: "10px",
                border: "1px dashed rgba(255,255,255,0.1)", background: "transparent",
                color: "#6b5452", fontSize: "12px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = "#e8dbd8"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#6b5452"; }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add instrument part
            </button>
          ) : (
            <button
              type="button"
              onClick={addPart}
              style={{
                padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#c8b8b6", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
              }}
            >
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add part
            </button>
          )}
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
