"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Collection = { id: string; name: string };

type Props = {
  scoreId: string;
  userId: string | null;
  onRequireAuth: () => void;
};

export default function SaveButton({ scoreId, userId, onRequireAuth }: Props) {
  const [saved, setSaved] = useState(false);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Check saved state
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("saved_scores")
      .select("collection_id")
      .eq("score_id", scoreId)
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setSaved(true); setCollectionId(data.collection_id); }
      });
  }, [scoreId, userId]);

  // Load collections when picker opens
  useEffect(() => {
    if (!showPicker || !userId) return;
    const supabase = createClient();
    supabase
      .from("collections")
      .select("id, name")
      .eq("user_id", userId)
      .order("created_at")
      .then(({ data }) => setCollections((data as Collection[]) ?? []));
  }, [showPicker, userId]);

  // Close on outside click
  useEffect(() => {
    if (!showPicker) return;
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowPicker(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  async function doSave(toCollectionId: string | null) {
    if (!userId) return;
    setLoading(true);
    const supabase = createClient();
    if (saved) {
      await supabase
        .from("saved_scores")
        .update({ collection_id: toCollectionId })
        .eq("score_id", scoreId)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("saved_scores")
        .insert({ score_id: scoreId, user_id: userId, collection_id: toCollectionId });
    }
    setSaved(true);
    setCollectionId(toCollectionId);
    setShowPicker(false);
    setLoading(false);
  }

  async function doUnsave() {
    if (!userId) return;
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("saved_scores")
      .delete()
      .eq("score_id", scoreId)
      .eq("user_id", userId);
    setSaved(false);
    setCollectionId(null);
    setShowPicker(false);
    setLoading(false);
  }

  async function createAndSave() {
    if (!newName.trim() || !userId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("collections")
      .insert({ user_id: userId, name: newName.trim() })
      .select("id, name")
      .single();
    if (data) {
      setCollections(prev => [...prev, data as Collection]);
      await doSave((data as Collection).id);
      setNewName("");
    }
    setLoading(false);
  }

  const collectionName = collections.find(c => c.id === collectionId)?.name;

  return (
    <div style={{ position: "relative" }}>
      {/* Main button — always opens picker */}
      <button
        onClick={() => {
          if (!userId) { onRequireAuth(); return; }
          setShowPicker(v => !v);
        }}
        disabled={loading}
        style={{
          width: "100%", padding: "11px", borderRadius: "10px",
          background: saved ? "rgba(107,143,189,0.12)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${saved ? "rgba(107,143,189,0.35)" : "rgba(255,255,255,0.1)"}`,
          color: saved ? "#6b8fbd" : "#a89690", fontSize: "13px", fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          transition: "all 0.15s",
        }}
      >
        <svg width="14" height="14" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>

      {/* Collection hint */}
      {saved && collectionName && (
        <p style={{ textAlign: "center", fontSize: "11px", color: "#6b5452", marginTop: "4px" }}>
          In &ldquo;{collectionName}&rdquo;
        </p>
      )}

      {/* Picker */}
      {showPicker && (
        <div
          ref={pickerRef}
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 60,
            background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px", padding: "12px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          }}
        >
          <p style={{ fontSize: "11px", color: "#6b5452", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Save to
          </p>

          {/* No collection */}
          <button
            onClick={() => doSave(null)}
            style={{
              width: "100%", padding: "8px 10px", textAlign: "left", borderRadius: "7px",
              background: collectionId === null && saved ? "rgba(255,255,255,0.08)" : "none",
              border: "none", color: "#e8dbd8", fontSize: "13px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            All saved
          </button>

          {/* Existing collections */}
          {collections.map(c => (
            <button
              key={c.id}
              onClick={() => doSave(c.id)}
              style={{
                width: "100%", padding: "8px 10px", textAlign: "left", borderRadius: "7px",
                background: collectionId === c.id ? "rgba(255,255,255,0.08)" : "none",
                border: "none", color: "#e8dbd8", fontSize: "13px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px",
              }}
            >
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
                <path d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.4A1 1 0 0011.121 6.4L12.3 5.3A1 1 0 0113 5h6a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
              {c.name}
            </button>
          ))}

          {/* New collection */}
          <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "6px" }}>
            <input
              type="text"
              placeholder="New collection…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createAndSave(); }}
              style={{
                flex: 1, padding: "7px 10px", borderRadius: "7px",
                background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: "12px", outline: "none",
              }}
            />
            <button
              onClick={createAndSave}
              disabled={!newName.trim() || loading}
              style={{
                padding: "7px 12px", borderRadius: "7px", background: "#fff",
                color: "#211817", fontSize: "12px", fontWeight: 600,
                cursor: "pointer", border: "none", flexShrink: 0,
              }}
            >
              +
            </button>
          </div>

          {/* Unsave */}
          {saved && (
            <button
              onClick={doUnsave}
              style={{
                width: "100%", marginTop: "8px", padding: "7px",
                background: "none", border: "none", color: "#c0392b",
                fontSize: "12px", cursor: "pointer", borderRadius: "7px",
              }}
            >
              Remove from saved
            </button>
          )}
        </div>
      )}
    </div>
  );
}
