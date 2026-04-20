"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Score } from "@/lib/supabase/types";

interface Props {
  score: Score;
  isOwner?: boolean;
  onEdit?: (s: Score) => void;
}

export default function ScoreCard({ score, isOwner, onEdit }: Props) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      onClick={() => {
        sessionStorage.setItem("scoreFrom", pathname + window.location.search);
        router.push(`/community/${score.id}`);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#1e1513",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)"}`,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 36px rgba(0,0,0,0.45)" : "none",
        transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.18s ease",
      }}
    >
      {/*
        Image area: paddingTop 70% sets height = 70% of card width.
        Using background-image (not <img>) so the image has zero intrinsic
        dimensions and can NEVER push the container taller. Guaranteed.
      */}
      <div style={{
        flexShrink: 0,
        width: "100%",
        paddingTop: "70%",
        position: "relative",
        overflow: "hidden",
        background: score.cover_url
          ? `#f5f0eb url("${score.cover_url}") top center / cover no-repeat`
          : "#1a1210",
      }}>
        {/* No-cover: sheet music placeholder */}
        {!score.cover_url && (
          <div style={{
            position: "absolute",
            top: "6%", left: "12%", right: "12%", bottom: "-55%",
            background: "#faf8f5",
            boxShadow: hovered ? "0 10px 32px rgba(0,0,0,0.6)" : "0 5px 18px rgba(0,0,0,0.45)",
            transform: hovered ? "scale(1.03)" : "scale(1)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingTop: "10%",
            gap: 0,
          }}>
            {/* Treble clef */}
            <svg width="22" height="40" viewBox="0 0 22 40" fill="none" style={{ opacity: 0.22, marginBottom: "5%", flexShrink: 0 }}>
              <path d="M11 2 C11 2 6 8 6 16 C6 22 9 25 11 27 C13 29 15 31 15 35 C15 38 13 39 11 39 C9 39 7 38 7 36" stroke="#1a1210" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
              <path d="M11 2 C15 5 17 10 17 15 C17 20 14 23 11 25" stroke="#1a1210" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
              <circle cx="9" cy="35" r="2.5" fill="#1a1210" opacity="0.4"/>
            </svg>
            {/* Staff lines — 2 groups of 5 */}
            {[0,1,2,3,4].map(i => (
              <div key={`a${i}`} style={{ width: "75%", height: "1px", background: "rgba(26,18,16,0.18)", marginBottom: i < 4 ? "5%" : "10%" }} />
            ))}
            {[0,1,2,3,4].map(i => (
              <div key={`b${i}`} style={{ width: "75%", height: "1px", background: "rgba(26,18,16,0.12)", marginBottom: i < 4 ? "5%" : 0 }} />
            ))}
          </div>
        )}

        {/* Hover overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(22,16,15,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          opacity: hovered ? 1 : 0, transition: "opacity 0.18s ease", zIndex: 2,
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

      {/* Info — fixed 80px */}
      <div style={{
        flexShrink: 0,
        height: "104px",
        padding: "10px 14px 12px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <p style={{
          fontSize: "13px", fontWeight: 500, color: "#e8dbd8",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          margin: 0,
        }}>
          {score.title}
        </p>
        <p style={{
          fontSize: "11px", color: "#6b5452",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          margin: "8px 0 0",
        }}>
          {score.composer || "—"}
        </p>
        {score.profiles?.handle && (
          <p style={{
            fontSize: "10px", color: "#4a3532",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            margin: "6px 0 0",
          }}>
            @{score.profiles.handle}
          </p>
        )}

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "auto",
        }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {score.parts && score.parts.length > 0 && (
              <span style={{
                fontSize: "10px", padding: "2px 6px", borderRadius: "4px",
                background: "rgba(107,143,189,0.12)", color: "#6b8fbd",
                border: "1px solid rgba(107,143,189,0.22)",
              }}>
                Parts
              </span>
            )}
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
    </div>
  );
}
