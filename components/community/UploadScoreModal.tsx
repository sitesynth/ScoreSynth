"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";

const CATEGORIES = ["piano", "strings", "woodwinds", "brass", "chamber", "symphonic", "guitar", "choir", "percussion", "soundtracks"];
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
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: "8px",
    background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none",
    WebkitAppearance: "none",
    cursor: "pointer",
    paddingRight: "36px",
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

    // Upload cover image if provided
    let coverUrl: string | null = null;
    if (coverFile) {
      const coverPath = `${user.id}/${Date.now()}-${coverFile.name}`;
      const { error: coverErr } = await supabase.storage.from("covers").upload(coverPath, coverFile);
      if (!coverErr) {
        const { data } = supabase.storage.from("covers").getPublicUrl(coverPath);
        coverUrl = data.publicUrl;
      }
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
            {[
              { value: category, onChange: (v: string) => setCategory(v), options: CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })) },
              { value: difficulty, onChange: (v: string) => setDifficulty(v), options: DIFFICULTIES.map(d => ({ value: d, label: d })) },
            ].map((sel, i) => (
              <div key={i} style={{ position: "relative" }}>
                <select
                  value={sel.value}
                  onChange={e => sel.onChange(e.target.value)}
                  style={selectStyle}
                >
                  {sel.options.map(o => (
                    <option key={o.value} value={o.value} style={{ background: "#1e1513" }}>{o.label}</option>
                  ))}
                </select>
                <svg
                  width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
                  viewBox="0 0 24 24" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#6b5452", pointerEvents: "none" }}
                >
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

          {/* Cover image upload */}
          <div>
            <label style={{ fontSize: "12px", color: "#6b5452", marginBottom: "6px", display: "block" }}>
              Cover Image (PNG/JPG)
            </label>
            <label style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
              background: "#1e1513", border: "1px dashed rgba(255,255,255,0.15)",
              fontSize: "13px", color: coverFile ? "#e8dbd8" : "#6b5452",
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              {coverFile ? coverFile.name : "Choose image…"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setCoverFile(e.target.files?.[0] ?? null)} />
            </label>
            {coverFile && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={URL.createObjectURL(coverFile)}
                alt="Cover preview"
                style={{ marginTop: "8px", width: "100%", borderRadius: "8px", maxHeight: "140px", objectFit: "cover" }}
              />
            )}
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
