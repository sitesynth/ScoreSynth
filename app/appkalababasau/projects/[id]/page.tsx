"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MOCK_PROJECTS } from "@/lib/app-data";

export default function ProjectPage() {
  const { id } = useParams() as { id: string };
  const project = MOCK_PROJECTS.find(p => p.id === id);
  const [hovered, setHovered] = useState<string | null>(null);

  if (!project) return (
    <div style={{ padding: "40px", color: "#a89690" }}>
      Project not found. <Link href="/appkalababasau/projects" style={{ color: "#6b8fbd" }}>← Back</Link>
    </div>
  );

  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: 400, color: "#fff" }}>
          {project.name} overview
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select style={{
            padding: "6px 12px", borderRadius: "8px", fontSize: "12px",
            background: "#2a1f1e", border: "1px solid rgba(255,255,255,0.09)",
            color: "#a89690", cursor: "pointer", outline: "none",
          }}>
            <option>Last modified</option>
            <option>Alphabetical</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {project.compositions.map(c => (
          <div key={c.id}
            onMouseEnter={() => setHovered(c.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              width: "260px", borderRadius: "12px", overflow: "hidden",
              border: `1px solid ${hovered === c.id ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
              background: "#1c1210", cursor: "pointer",
              transform: hovered === c.id ? "translateY(-2px)" : "translateY(0)",
              transition: "all 0.2s ease",
              boxShadow: hovered === c.id ? "0 8px 28px rgba(0,0,0,0.45)" : "none",
            }}
          >
            <div style={{
              background: "#f5f0eb", height: "300px",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#9a8e89", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Image of project
              </span>
              {hovered === c.id && (
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
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", marginBottom: "4px" }}>{c.name}</p>
              <p style={{ fontSize: "11px", color: "#6b5452" }}>updated {c.updatedAt}</p>
            </div>
          </div>
        ))}

        {/* Add composition */}
        <div style={{
          width: "260px", borderRadius: "12px", overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#1c1210", cursor: "pointer",
          display: "flex", flexDirection: "column",
          transition: "border-color 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
        >
          <div style={{
            flex: 1, minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%", background: "#c0392b",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(192,57,43,0.4)",
            }}>
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            </div>
          </div>
          <div style={{ padding: "12px 14px 14px" }}>
            <p style={{ fontSize: "13px", color: "#6b5452" }}>New composition</p>
          </div>
        </div>
      </div>
    </div>
  );
}
