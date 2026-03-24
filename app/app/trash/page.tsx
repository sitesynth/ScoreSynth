"use client";

export default function TrashPage() {
  return (
    <div style={{ padding: "36px 40px" }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: 400, color: "#fff", marginBottom: "40px" }}>
        Trash
      </h1>
      <div style={{ paddingTop: "60px", textAlign: "center" }}>
        <svg width="48" height="48" fill="none" stroke="#3d2a28" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 16px" }}>
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
        <p style={{ fontSize: "14px", color: "#6b5452" }}>Trash is empty.</p>
        <p style={{ fontSize: "12px", color: "#3d2a28", marginTop: "6px" }}>Deleted projects will be kept here for 30 days.</p>
      </div>
    </div>
  );
}
