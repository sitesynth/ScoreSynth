"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import { processPdfForUpload } from "@/lib/pdf-processor";

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

const MAX_FILE_MB = 50;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

// Strips non-ASCII / spaces from filename so Supabase Storage accepts the key
const safeStorageName = (file: File) => {
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "bin";
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
};

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

type Part = { name: string; file: File | null };

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function UploadScoreModal({ onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

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
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Instrument parts
  const [parts, setParts] = useState<Part[]>([]);
  const [partFileDragIdx,  setPartFileDragIdx]  = useState<number | null>(null);
  const [reorderDrag,      setReorderDrag]      = useState<{ fromIdx: number } | null>(null);
  const [reorderOverIdx,   setReorderOverIdx]   = useState<number | null>(null);
  const [coverDrag,  setCoverDrag]  = useState(false);
  const [pdfDrag,    setPdfDrag]    = useState(false);
  const [audioDrag,  setAudioDrag]  = useState(false);
  const [copyrightConfirmed, setCopyrightConfirmed] = useState(false);

  // Collections
  const [collections, setCollections] = useState<{ id: string; name: string; parent_id: string | null }[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("resource_collections").select("id, name, parent_id").eq("user_id", user.id).order("created_at")
      .then(({ data }) => setCollections((data ?? []) as { id: string; name: string; parent_id: string | null }[]));
  }, [user]);

  const hasEnteredData = useMemo(() => {
    const hasPartData = parts.some((p) => p.name.trim() || p.file);

    return Boolean(
      title.trim() ||
      composer.trim() ||
      publisher.trim() ||
      description.trim() ||
      instruments.trim() ||
      (tag === "premium" && priceDisplay.trim()) ||
      difficulty !== "Intermediate" ||
      category !== "piano" ||
      pages !== 1 ||
      pdfFile ||
      coverFile ||
      audioFile ||
      hasPartData,
    );
  }, [
    title,
    composer,
    publisher,
    description,
    instruments,
    tag,
    priceDisplay,
    difficulty,
    category,
    pages,
    pdfFile,
    coverFile,
    audioFile,
    parts,
  ]);

  const handleRequestClose = () => {
    if (uploading) return;

    if (hasEnteredData) {
      setShowCloseConfirm(true);
      return;
    }

    onClose();
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const addPart = () => setParts(prev => [...prev, { name: "", file: null }]);
  const removePart = (i: number) => setParts(prev => prev.filter((_, idx) => idx !== i));
  const updatePartName = (i: number, name: string) =>
    setParts(prev => prev.map((p, idx) => idx === i ? { ...p, name } : p));
  const updatePartFile = (i: number, file: File | null) =>
    setParts(prev => prev.map((p, idx) => idx === i ? { ...p, file } : p));

  const reorderParts = (from: number, to: number) => {
    if (from === to) return;
    setParts(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

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

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: "8px",
    background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, appearance: "none", WebkitAppearance: "none",
    cursor: "pointer", paddingRight: "36px",
  };

  const handleSubmit = async () => {
    if (!user) { setError("You must be signed in to upload."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    if (!pdfFile) { setError("Please select a PDF file."); return; }

    // File size checks
    if (pdfFile.size > MAX_FILE_BYTES) {
      setError(`PDF is too large (${(pdfFile.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_MB} MB.`);
      return;
    }
    for (const part of parts) {
      if (part.file && part.file.size > MAX_FILE_BYTES) {
        setError(`Part "${part.name || part.file.name}" is too large (${(part.file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_MB} MB.`);
        return;
      }
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();

    // Process PDF: strip original metadata, embed ScoreSynth branding pages
    const processedPdf = await processPdfForUpload(pdfFile, title.trim());

    // Upload main PDF
    const pdfPath = `${user.id}/${safeStorageName(pdfFile)}`;
    const { error: uploadError } = await supabase.storage.from("score-files").upload(pdfPath, processedPdf);
    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    // Upload cover image (or auto-generate from PDF first page)
    let coverUrl: string | null = null;
    const coverSource = coverFile ?? await generatePdfThumbnail(pdfFile);
    if (coverSource) {
      const ext = coverFile ? coverFile.name.split(".").pop() : "jpg";
      const coverPath = `${user.id}/${Date.now()}-cover.${ext}`;
      const { error: coverErr } = await supabase.storage.from("avatars").upload(coverPath, coverSource);
      if (!coverErr) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(coverPath);
        coverUrl = data.publicUrl;
      }
    }

    // Upload audio recording
    let audioPath: string | null = null;
    if (audioFile) {
      const ext = audioFile.name.split(".").pop()?.toLowerCase() ?? "mp3";
      const ap = `${user.id}/audio/${Date.now()}.${ext}`;
      const { error: audioErr } = await supabase.storage.from("score-files").upload(ap, audioFile);
      if (!audioErr) audioPath = ap;
    }

    // Upload instrument parts
    const uploadedParts: { name: string; pdf_url: string }[] = [];
    for (const part of parts) {
      if (!part.name.trim() || !part.file) continue;
      const processedPart = await processPdfForUpload(part.file, `${title.trim()} — ${part.name.trim()}`);
      const partPath = `${user.id}/parts/${safeStorageName(part.file)}`;
      const { error: partErr } = await supabase.storage.from("score-files").upload(partPath, processedPart);
      if (!partErr) uploadedParts.push({ name: part.name.trim(), pdf_url: partPath });
    }

    const { error: insertError } = await supabase.from("scores").insert({
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
      cover_url: coverUrl,
      midi_url: audioPath,
      author_id: user.id,
      parts: uploadedParts,
      resource_collection_id: selectedCollectionId,
    });

    setUploading(false);
    if (insertError) { setError(`Failed to save score: ${insertError.message}`); return; }
    onSuccess();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#2a1f1e", borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "32px", width: "100%", maxWidth: "600px",
          maxHeight: "90vh", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: "14px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#fff", fontWeight: 400 }}>
            Upload a score
          </h2>
          <button
            onClick={handleRequestClose}
            style={{ color: "#6b5452", fontSize: "20px", lineHeight: 1, padding: "4px", cursor: "pointer", background: "none", border: "none" }}
          >
            ×
          </button>
        </div>

        {/* Fields */}
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
            {[
              { value: category, onChange: (v: string) => setCategory(v), options: CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c] ?? c })) },
              { value: difficulty, onChange: (v: string) => setDifficulty(v), options: DIFFICULTIES.map(d => ({ value: d, label: d })) },
            ].map((sel, i) => (
              <div key={i} style={{ position: "relative" }}>
                <select value={sel.value} onChange={e => sel.onChange(e.target.value)} style={selectStyle}>
                  {sel.options.map(o => (
                    <option key={o.value} value={o.value} style={{ background: "#1e1513" }}>{o.label}</option>
                  ))}
                </select>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#6b5452", pointerEvents: "none" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            ))}
          </div>

          <input type="text" placeholder="Instruments (comma-separated, e.g. Piano, Violin)" value={instruments} onChange={e => setInstruments(e.target.value)} style={inputStyle} />

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "#a89690" }}>
              <input type="radio" checked={tag === "free"} onChange={() => setTag("free")} style={{ accentColor: "#c0392b" }} /> Free
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "#a89690" }}>
              <input type="radio" checked={tag === "premium"} onChange={() => setTag("premium")} style={{ accentColor: "#c0392b" }} /> Premium
            </label>
            {tag === "premium" && (
              <input type="text" placeholder="Price (e.g. €4.99)" value={priceDisplay} onChange={e => setPriceDisplay(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label style={{ fontSize: "13px", color: "#a89690", flexShrink: 0 }}>Pages</label>
            <input type="number" min={1} value={pages} onChange={e => setPages(Number(e.target.value))} style={{ ...inputStyle, width: "80px" }} />
          </div>

          {/* Cover image */}
          <div>
            <label style={{ fontSize: "12px", color: "#6b5452", marginBottom: "6px", display: "block" }}>Cover Image (PNG/JPG)</label>
            <label
              {...makeDrop(f => f.type.startsWith("image/"), setCoverFile, setCoverDrag)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: coverDrag ? "18px 14px" : "10px 14px",
                borderRadius: "8px", cursor: "pointer",
                background: coverDrag ? "rgba(255,255,255,0.05)" : "#1e1513",
                border: coverDrag ? "1px dashed rgba(255,255,255,0.4)" : coverFile ? "1px dashed rgba(200,169,126,0.4)" : "1px dashed rgba(255,255,255,0.15)",
                fontSize: "13px", color: coverFile ? "#e8dbd8" : "#6b5452",
                transition: "padding 0.15s, border-color 0.15s, background 0.15s",
                justifyContent: coverDrag ? "center" : undefined,
              }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              {coverDrag ? "Drop image here" : coverFile ? coverFile.name : "Choose or drag image…"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setCoverFile(e.target.files?.[0] ?? null)} />
            </label>
            {coverFile && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={URL.createObjectURL(coverFile)} alt="Cover preview"
                style={{ marginTop: "8px", width: "100%", borderRadius: "8px", maxHeight: "140px", objectFit: "cover" }} />
            )}
          </div>

          {/* Main PDF */}
          <div>
            <label style={{ fontSize: "12px", color: "#6b5452", marginBottom: "6px", display: "block" }}>Full Score PDF *</label>
            <label
              {...makeDrop(f => f.type === "application/pdf" || f.name.endsWith(".pdf"), setPdfFile, setPdfDrag)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: pdfDrag ? "18px 14px" : "10px 14px",
                borderRadius: "8px", cursor: "pointer",
                background: pdfDrag ? "rgba(255,255,255,0.05)" : "#1e1513",
                border: pdfDrag ? "1px dashed rgba(255,255,255,0.4)" : pdfFile ? "1px solid rgba(200,169,126,0.4)" : "1px dashed rgba(255,255,255,0.15)",
                fontSize: "13px", color: pdfFile ? "#c8a97e" : "#6b5452",
                transition: "padding 0.15s, border-color 0.15s, background 0.15s",
                justifyContent: pdfDrag ? "center" : undefined,
              }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {pdfDrag ? "Drop PDF here" : pdfFile ? pdfFile.name : "Choose or drag PDF…"}
              <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
              {pdfFile && !pdfDrag && (
                <button type="button"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setPdfFile(null); }}
                  style={{ marginLeft: "auto", background: "none", border: "none", color: "#6b5452", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: 0 }}
                >×</button>
              )}
            </label>
          </div>

          {/* ── Audio Recording ── */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "14px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dbd8", margin: "0 0 4px" }}>Audio Recording</p>
            <p style={{ fontSize: "11px", color: "#6b5452", margin: "0 0 10px", lineHeight: 1.5 }}>
              Attach an MP3 or WAV recording so listeners can hear the piece.
            </p>
            <label
              {...makeDrop(f => f.type.startsWith("audio/"), setAudioFile, setAudioDrag)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: audioDrag ? "18px 14px" : "10px 14px",
                borderRadius: "8px", cursor: "pointer",
                background: audioDrag ? "rgba(255,255,255,0.05)" : "#1e1513",
                border: audioDrag ? "1px dashed rgba(255,255,255,0.4)" : audioFile ? "1px solid rgba(200,169,126,0.45)" : "1px dashed rgba(255,255,255,0.15)",
                fontSize: "13px", color: audioFile ? "#c8a97e" : "#6b5452",
                transition: "padding 0.15s, border-color 0.15s, background 0.15s",
                justifyContent: audioDrag ? "center" : undefined,
              }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {audioDrag ? "Drop audio here" : audioFile ? audioFile.name : "Choose or drag audio…"}
              </span>
              {audioFile && !audioDrag && (
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setAudioFile(null); }}
                  style={{ background: "none", border: "none", color: "#6b5452", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: 0, flexShrink: 0 }}
                >×</button>
              )}
              <input type="file" accept="audio/*" style={{ display: "none" }} onChange={e => setAudioFile(e.target.files?.[0] ?? null)} />
            </label>
            {audioFile && (
              <audio
                controls
                src={URL.createObjectURL(audioFile)}
                style={{ width: "100%", marginTop: "8px", height: "36px" }}
              />
            )}
          </div>

          {/* ── Collection ── */}
          {collections.length > 0 && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dbd8", margin: "0 0 10px" }}>Add to Collection</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {collections.map(c => {
                  const active = selectedCollectionId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCollectionId(active ? null : c.id)}
                      style={{
                        padding: "5px 13px", borderRadius: "20px", fontSize: "12px", fontWeight: 500,
                        cursor: "pointer", transition: "all 0.15s",
                        background: active ? "rgba(200,169,126,0.18)" : "rgba(255,255,255,0.05)",
                        border: active ? "1px solid rgba(200,169,126,0.5)" : "1px solid rgba(255,255,255,0.1)",
                        color: active ? "#c8a97e" : "#8a7270",
                        paddingLeft: c.parent_id ? "24px" : undefined,
                      }}
                    >
                      {active && <span style={{ marginRight: "5px", fontSize: "10px" }}>✓</span>}
                      {c.parent_id && <span style={{ opacity: 0.5, marginRight: "3px" }}>↳</span>}
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Instrument Parts ── */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
            {/* Header */}
            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dbd8", margin: "0 0 3px" }}>Instrument Parts</p>
              <p style={{ fontSize: "11px", color: "#6b5452", margin: 0, lineHeight: 1.5 }}>
                Upload individual parts (Violin I, Cello, Trumpet…) so players can download separately.
              </p>
            </div>

            {/* Parts list */}
            {parts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                {parts.map((part, i) => (
                  <div
                    key={i}
                    onDragOver={e => { e.preventDefault(); setReorderOverIdx(i); }}
                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setReorderOverIdx(null); }}
                    onDrop={e => { e.preventDefault(); if (reorderDrag !== null) { reorderParts(reorderDrag.fromIdx, i); setReorderDrag(null); setReorderOverIdx(null); } }}
                    onDragEnd={() => { setReorderDrag(null); setReorderOverIdx(null); }}
                    style={{
                      display: "grid", gridTemplateColumns: "auto 1fr 1fr auto",
                      gap: "8px", alignItems: "center",
                      background: reorderOverIdx === i ? "rgba(192,57,43,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${reorderOverIdx === i ? "rgba(192,57,43,0.35)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: "10px", padding: "8px 10px",
                      transition: "background 0.12s, border-color 0.12s",
                    }}
                  >
                    {/* Drag handle */}
                    <span
                      draggable
                      onDragStart={e => { e.stopPropagation(); setReorderDrag({ fromIdx: i }); }}
                      style={{ display: "inline-flex", flexShrink: 0, cursor: "grab" }}
                    >
                      <svg width="12" height="12" fill="none" stroke="#4a3532" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="3" y1="8"  x2="21" y2="8"/>
                        <line x1="3" y1="16" x2="21" y2="16"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Name, e.g. Violin I"
                      value={part.name}
                      onChange={e => updatePartName(i, e.target.value)}
                      style={{ ...inputStyle, padding: "7px 10px", fontSize: "12px", background: "rgba(255,255,255,0.05)" }}
                    />
                    <label
                      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setPartFileDragIdx(i); }}
                      onDragLeave={e => { e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPartFileDragIdx(null); }}
                      onDrop={e => { e.preventDefault(); e.stopPropagation(); setPartFileDragIdx(null); const f = e.dataTransfer.files[0]; if (f && (f.type === "application/pdf" || f.name.endsWith(".pdf"))) updatePartFile(i, f); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: partFileDragIdx === i ? "14px 10px" : "7px 10px",
                        borderRadius: "8px", cursor: "pointer",
                        background: partFileDragIdx === i ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                        border: partFileDragIdx === i ? "1px dashed rgba(255,255,255,0.4)" : "1px dashed rgba(255,255,255,0.1)",
                        fontSize: "12px", color: part.file ? "#c8a97e" : "#6b5452", overflow: "hidden",
                        transition: "padding 0.15s, border-color 0.15s, background 0.15s",
                        justifyContent: partFileDragIdx === i ? "center" : undefined,
                      }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {partFileDragIdx === i ? "Drop PDF here" : part.file ? part.file.name : "Choose or drag PDF…"}
                      </span>
                      <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => updatePartFile(i, e.target.files?.[0] ?? null)} />
                    </label>
                    <button
                      onClick={() => removePart(i)}
                      title="Remove"
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

            {/* Empty state + Add button */}
            {parts.length === 0 ? (
              <button
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
        </div>

        {/* Copyright confirmation */}
        <label style={{
          display: "flex", alignItems: "flex-start", gap: "10px",
          padding: "14px", borderRadius: "10px",
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          cursor: "pointer",
        }}>
          <input
            type="checkbox"
            checked={copyrightConfirmed}
            onChange={e => setCopyrightConfirmed(e.target.checked)}
            style={{ accentColor: "#c0392b", marginTop: "2px", flexShrink: 0, width: "14px", height: "14px" }}
          />
          <span style={{ fontSize: "12px", color: "#a89690", lineHeight: 1.6 }}>
            I confirm that I own the rights to this content or hold a valid license to distribute it, and I accept full responsibility for any copyright claims arising from this upload, in accordance with the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#c8a97e", textDecoration: "none" }}>Terms of Service</a>
            {" "}and{" "}
            <a href="/copyright" target="_blank" rel="noopener noreferrer" style={{ color: "#c8a97e", textDecoration: "none" }}>Copyright Policy</a>.
          </span>
        </label>

        {error && <p style={{ fontSize: "12px", color: "#c0392b" }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={uploading || !copyrightConfirmed}
          style={{
            width: "100%", padding: "12px", borderRadius: "10px",
            background: "#fff", color: "#211817", fontSize: "13px", fontWeight: 600,
            cursor: (uploading || !copyrightConfirmed) ? "not-allowed" : "pointer", border: "none",
            opacity: (uploading || !copyrightConfirmed) ? 0.4 : 1, transition: "opacity 0.15s", marginTop: "4px",
          }}
        >
          {uploading ? `Uploading… (${parts.filter(p => p.file).length > 0 ? "score + parts" : "score"})` : "Publish score"}
        </button>
      </div>

      {showCloseConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#2a1f1e",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
              padding: "20px",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontFamily: "Georgia, serif",
                fontSize: "24px",
                color: "#fff",
                fontWeight: 400,
              }}
            >
              Close upload form?
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#a89690", lineHeight: 1.55 }}>
              You have unsaved changes. If you close now, entered data and selected files will be lost.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCloseConfirm(false)}
                style={{
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "transparent",
                  color: "#e8dbd8",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Continue editing
              </button>
              <button
                onClick={handleConfirmClose}
                style={{
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#c0392b",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close without saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
