"use client";

import { useState } from "react";
import { MOCK_RECENTS } from "@/lib/app-data";

function CompositionCard({ name, updatedAt }: { name: string; updatedAt: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "260px", borderRadius: "12px", overflow: "hidden",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
        background: "#1c1210", cursor: "pointer",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.2s ease",
        boxShadow: hovered ? "0 8px 28px rgba(0,0,0,0.45)" : "none",
      }}
    >
      <div style={{
        background: "#f5f0eb", height: "320px",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#9a8e89", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Image of project
        </span>
        {hovered && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(33,24,23,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontSize: "12px", fontWeight: 500, color: "#fff",
              padding: "7px 16px", borderRadius: "20px",
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}>Open</span>
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", marginBottom: "4px" }}>{name}</p>
        <p style={{ fontSize: "11px", color: "#6b5452" }}>1 file • updated {updatedAt}</p>
      </div>
    </div>
  );
}

export default function RecentsPage() {
  const [tab, setTab] = useState<"recent" | "shared">("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div style={{ padding: "36px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: 400, color: "#fff" }}>
          Recently viewed overview
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select style={{
            padding: "6px 12px", borderRadius: "8px", fontSize: "12px",
            background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.09)",
            color: "#a89690", cursor: "pointer", outline: "none",
          }}>
            <option>Last modified</option>
            <option>Alphabetical</option>
            <option>Date created</option>
          </select>
          <div style={{ display: "flex", background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", overflow: "hidden" }}>
            {(["grid", "list"] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: "6px 9px", background: viewMode === mode ? "rgba(255,255,255,0.1)" : "none",
                border: "none", cursor: "pointer", color: viewMode === mode ? "#fff" : "#6b5452",
                display: "flex", alignItems: "center", transition: "all 0.15s",
              }}>
                {mode === "grid"
                  ? <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
                  : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                }
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "28px" }}>
        {(["recent", "shared"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "7px 16px", borderRadius: "8px", fontSize: "13px",
            background: tab === t ? "#2a1f1e" : "none",
            border: tab === t ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
            color: tab === t ? "#e8dbd8" : "#6b5452",
            cursor: "pointer", fontWeight: tab === t ? 500 : 400,
            transition: "all 0.15s",
          }}>
            {t === "recent" ? "Recently viewed" : "Shared"}
          </button>
        ))}
      </div>

      {tab === "recent" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {MOCK_RECENTS.map(c => (
            <CompositionCard key={c.id} name={c.name} updatedAt={c.updatedAt} />
          ))}
        </div>
      )}
      {tab === "shared" && (
        <div style={{ paddingTop: "60px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "#6b5452" }}>No shared compositions yet.</p>
        </div>
      )}
    </div>
  );
}
