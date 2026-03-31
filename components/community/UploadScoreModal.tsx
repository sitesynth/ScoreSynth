"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";

const CATEGORIES = ["piano", "brass", "strings", "symphonic", "guitar", "choir"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function UploadScoreModal({ onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: "8px",
    background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box",
  };

  const handleSubmit = async () => {
    if (!user) { setError("You must be signed in to upload."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    if (!pdfFile) { setError("Please select a PDF file."); return; }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const pdfPath = `${user.id}/${Date.now()}-${pdfFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("score-files")
      .upload(pdfPath, pdfFile);

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
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
      author_id: user.id,
    });

    setUploading(false);
    if (insertError) { setError(`Failed to save score: ${insertError.message}`); return; }
    onSuccess();
    onClose();
  };

  return (
    <div
      onClick={onClose}
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
          padding: "32px", width: "100%", maxWidth: "480px",
          maxHeight: "90vh", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: "14px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#fff", fontWeight: 400 }}>
            Upload a score
          </h2>
          <button onClick={onClose} style={{ color: "#6b5452", fontSize: "20px", lineHeight: 1, padding: "4px", cursor: "pointer", background: "none", border: "none" }}>×</button>
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
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#1e1513" }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {DIFFICULTIES.map(d => <option key={d} value={d} style={{ background: "#1e1513" }}>{d}</option>)}
            </select>
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

          {/* PDF upload */}
          <div>
            <label style={{ fontSize: "12px", color: "#6b5452", marginBottom: "6px", display: "block" }}>
              PDF File *
            </label>
            <label style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
              background: "#1e1513", border: "1px dashed rgba(255,255,255,0.15)",
              fontSize: "13px", color: pdfFile ? "#e8dbd8" : "#6b5452",
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {pdfFile ? pdfFile.name : "Choose PDF…"}
              <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>

        {error && <p style={{ fontSize: "12px", color: "#c0392b" }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={uploading}
          style={{
            width: "100%", padding: "12px", borderRadius: "10px",
            background: "#fff", color: "#211817", fontSize: "13px", fontWeight: 600,
            cursor: uploading ? "not-allowed" : "pointer", border: "none",
            opacity: uploading ? 0.7 : 1, transition: "opacity 0.15s", marginTop: "4px",
          }}
        >
          {uploading ? "Uploading…" : "Publish score"}
        </button>
      </div>
    </div>
  );
}
