"use client";

export default function SavedPage() {
  return (
    <div style={{ padding: "36px 40px" }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: 400, color: "#fff", marginBottom: "40px" }}>
        Saved Compositions
      </h1>
      <div style={{ paddingTop: "60px", textAlign: "center" }}>
        <svg width="48" height="48" fill="none" stroke="#3d2a28" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 16px" }}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
        <p style={{ fontSize: "14px", color: "#6b5452" }}>No saved compositions yet.</p>
        <p style={{ fontSize: "12px", color: "#3d2a28", marginTop: "6px" }}>Compositions you save will appear here.</p>
      </div>
    </div>
  );
}
