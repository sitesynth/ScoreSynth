"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";

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

const CATEGORIES = ["piano", "strings", "woodwinds", "brass", "chamber", "symphonic", "guitar", "choir", "percussion", "soundtracks"];
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

    setUploading(true);
    setError(null);

    const supabase = createClient();

    // Upload main PDF
    const pdfPath = `${user.id}/${Date.now()}-${pdfFile.name}`;
    const { error: uploadError } = await supabase.storage.from("score-files").upload(pdfPath, pdfFile);
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
      const partPath = `${user.id}/parts/${Date.now()}-${part.file.name}`;
      const { error: partErr } = await supabase.storage.from("score-files").upload(partPath, part.file);
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
              { value: category, onChange: (v: string) => setCategory(v), options: CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })) },
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
            <label style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
              borderRadius: "8px", cursor: "pointer", background: "#1e1513",
              border: "1px dashed rgba(255,255,255,0.15)", fontSize: "13px",
              color: coverFile ? "#e8dbd8" : "#6b5452",
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              {coverFile ? coverFile.name : "Choose image…"}
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
            <label style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
              borderRadius: "8px", cursor: "pointer", background: "#1e1513",
              border: "1px dashed rgba(255,255,255,0.15)", fontSize: "13px",
              color: pdfFile ? "#e8dbd8" : "#6b5452",
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {pdfFile ? pdfFile.name : "Choose PDF…"}
              <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {/* ── Audio Recording ── */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "14px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dbd8", margin: "0 0 4px" }}>Audio Recording</p>
            <p style={{ fontSize: "11px", color: "#6b5452", margin: "0 0 10px", lineHeight: 1.5 }}>
              Attach an MP3 or WAV recording so listeners can hear the piece.
            </p>
            <label style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
              borderRadius: "8px", cursor: "pointer", background: "#1e1513",
              border: `1px dashed ${audioFile ? "rgba(200,169,126,0.45)" : "rgba(255,255,255,0.15)"}`,
              fontSize: "13px", color: audioFile ? "#c8a97e" : "#6b5452",
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {audioFile ? audioFile.name : "Choose audio file…"}
              </span>
              {audioFile && (
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
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr auto",
                    gap: "8px", alignItems: "center",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "10px", padding: "8px 10px",
                  }}>
                    <input
                      type="text"
                      placeholder="Name, e.g. Violin I"
                      value={part.name}
                      onChange={e => updatePartName(i, e.target.value)}
                      style={{
                        ...inputStyle, padding: "7px 10px", fontSize: "12px",
                        background: "rgba(255,255,255,0.05)",
                      }}
                    />
                    <label style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "7px 10px", borderRadius: "8px", cursor: "pointer",
                      background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.1)",
                      fontSize: "12px", color: part.file ? "#c8a97e" : "#6b5452",
                      overflow: "hidden",
                    }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {part.file ? part.file.name : "Choose PDF…"}
                      </span>
                      <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => updatePartFile(i, e.target.files?.[0] ?? null)} />
                    </label>
                    <button
                      onClick={() => removePart(i)}
                      title="Remove"
                      style={{
                        background: "none", border: "none", color: "#4a3532",
                        cursor: "pointer", padding: "4px", borderRadius: "6px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "color 0.15s",
                      }}
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
