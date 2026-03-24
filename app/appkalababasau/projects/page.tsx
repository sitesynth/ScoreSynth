"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_PROJECTS } from "@/lib/app-data";

function ProjectCard({ project }: { project: typeof MOCK_PROJECTS[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/app/projects/${project.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: "280px", borderRadius: "12px", overflow: "hidden",
          border: `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
          background: "#1c1210", cursor: "pointer",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          transition: "all 0.2s ease",
          boxShadow: hovered ? "0 8px 28px rgba(0,0,0,0.45)" : "none",
        }}
      >
        {/* 2×2 grid of file thumbnails */}
        <div style={{ padding: "12px 12px 8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              background: i === 0 ? "#f5f0eb" : "#2a1f1e",
              borderRadius: "6px", aspectRatio: "3/4",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.05)",
            }}>
              {i === 0 && (
                <span style={{ fontSize: "8px", color: "#9a8e89", letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "center", padding: "4px" }}>
                  Image of project
                </span>
              )}
            </div>
          ))}
        </div>
        <div style={{ padding: "8px 14px 14px" }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", marginBottom: "4px" }}>{project.name}</p>
          <p style={{ fontSize: "11px", color: "#6b5452" }}>{project.compositions.length} file • updated {project.updatedAt}</p>
        </div>
      </div>
    </Link>
  );
}

function NewProjectCard({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "280px", borderRadius: "12px", overflow: "hidden",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
        background: "#1c1210", cursor: "pointer",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ padding: "12px 12px 8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", position: "relative" }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            background: "#2a1f1e", borderRadius: "6px", aspectRatio: "3/4",
            border: "1px solid rgba(255,255,255,0.05)",
          }} />
        ))}
        {/* Plus button overlay */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "36px", height: "36px", borderRadius: "50%",
          background: "#c0392b",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(192,57,43,0.4)",
        }}>
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
      </div>
      <div style={{ padding: "8px 14px 14px" }}>
        <p style={{ fontSize: "13px", fontWeight: 400, color: "#6b5452" }}>New project</p>
      </div>
    </div>
  );
}

export default function AllProjectsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: 400, color: "#fff" }}>
          All projects overview
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {MOCK_PROJECTS.map(p => <ProjectCard key={p.id} project={p} />)}
        <NewProjectCard onClick={() => alert("Create new project")} />
      </div>
    </div>
  );
}
