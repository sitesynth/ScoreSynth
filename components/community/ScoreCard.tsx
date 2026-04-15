"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Score } from "@/lib/supabase/types";

interface Props {
  score: Score;
  isOwner?: boolean;
  onEdit?: (s: Score) => void;
}

export default function ScoreCard({ score, isOwner, onEdit }: Props) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/community/${score.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer", minWidth: 0, display: "flex", flexDirection: "column",
        borderRadius: "12px", overflow: "hidden",
        background: "#1e1513",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)"}`,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 36px rgba(0,0,0,0.45)" : "none",
        transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.18s ease",
      }}
    >
      {/* ── Image area ── */}
      {score.cover_url ? (
        /* Real cover – locked 4:3 box, image fills it regardless of original ratio */
        <div style={{
          position: "relative", paddingBottom: "75%", height: 0,
          overflow: "hidden", flexShrink: 0, background: "#f5f0eb",
        }}>
          <img
            src={score.cover_url}
            alt={score.title}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "top center",
              display: "block",
            }}
          />
          {/* Hover overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(22,16,15,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            opacity: hovered ? 1 : 0, transition: "opacity 0.18s ease",
          }}>
            <span style={{
              fontSize: "12px", fontWeight: 600, color: "#fff",
              padding: "7px 18px", borderRadius: "20px",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.22)",
            }}>View score</span>
            {isOwner && onEdit && (
              <span
                onClick={e => { e.stopPropagation(); onEdit(score); }}
                style={{
                  fontSize: "12px", fontWeight: 600, color: "#fff",
                  padding: "7px 16px", borderRadius: "20px",
                  background: "rgba(192,57,43,0.75)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(192,57,43,0.5)",
                  cursor: "pointer",
                }}
              >Edit</span>
            )}
          </div>
        </div>
      ) : (
        /* No cover – locked 4:3 box, A4 paper peeks from top */
        <div style={{
          position: "relative", paddingBottom: "75%", height: 0,
          overflow: "hidden", flexShrink: 0,
          background: "#1a1210",
        }}>
          {/* White A4 paper – extends below container, overflow clips it */}
          <div style={{
            position: "absolute",
            top: "6%", left: "12%", right: "12%",
            bottom: "-55%", /* A4 is portrait, extends well below the landscape mat */
            background: "#faf8f5",
            boxShadow: hovered
              ? "0 10px 32px rgba(0,0,0,0.6)"
              : "0 5px 18px rgba(0,0,0,0.45)",
            transform: hovered ? "scale(1.03)" : "scale(1)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            display: "flex", flexDirection: "column",
            alignItems: "center",
            paddingTop: "10%",
            paddingBottom: "10%",
          }}>
            {/* Treble clef */}
            <svg width="20" height="36" viewBox="0 0 20 36" fill="none" style={{ opacity: 0.15, marginBottom: "7%" }}>
              <path d="M10 1 C10 1 4 9 4 17 C4 24 8 27 10 29 C12 31 14 33 14 36" stroke="#1a1210" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              <path d="M10 1 C14 5 16 11 16 16 C16 21 13 24 10 26" stroke="#1a1210" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            </svg>
            {/* Staff lines */}
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                width: "68%", height: "1px",
                background: "rgba(26,18,16,0.18)",
                marginBottom: i < 4 ? "5%" : 0,
              }} />
            ))}
            {/* Composer */}
            <p style={{
              marginTop: "10%",
              fontSize: "8px", color: "rgba(26,18,16,0.28)",
              fontFamily: "Georgia, serif", textAlign: "center",
              padding: "0 12%", lineHeight: 1.5, margin: "10% 12% 0",
            }}>
              {score.composer || score.title}
            </p>
          </div>

          {/* Hover overlay */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            opacity: hovered ? 1 : 0, transition: "opacity 0.18s ease",
            zIndex: 2,
          }}>
            <span style={{
              fontSize: "12px", fontWeight: 600, color: "#fff",
              padding: "7px 18px", borderRadius: "20px",
              background: "rgba(22,16,15,0.6)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}>View score</span>
            {isOwner && onEdit && (
              <span
                onClick={e => { e.stopPropagation(); onEdit(score); }}
                style={{
                  fontSize: "12px", fontWeight: 600, color: "#fff",
                  padding: "7px 16px", borderRadius: "20px",
                  background: "rgba(192,57,43,0.75)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(192,57,43,0.5)",
                  cursor: "pointer",
                }}
              >Edit</span>
            )}
          </div>
        </div>
      )}

      {/* ── Info – fixed height so every card is identical ── */}
      <div style={{
        padding: "10px 14px 12px", flexShrink: 0,
        height: "84px", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
          {score.title}
        </p>
        <p style={{ fontSize: "11px", color: "#6b5452", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {score.composer || "—"}
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b5452" }}>
              <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {score.likes_count.toLocaleString()}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b5452" }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              {score.views_count.toLocaleString()}
            </span>
          </div>
          <span style={{
            fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
            background: score.tag === "free" ? "rgba(111,207,151,0.1)" : "rgba(255,255,255,0.06)",
            color: score.tag === "free" ? "#6fcf97" : "#a89690",
            border: `1px solid ${score.tag === "free" ? "rgba(111,207,151,0.2)" : "transparent"}`,
          }}>
            {score.tag === "free" ? "Free" : score.price_display ?? "Premium"}
          </span>
        </div>
      </div>
    </div>
  );
}
