"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/auth/continue"), 900);
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#211817",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "#2a1f1e",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}>
        <h1 style={{ margin: 0, color: "#fff", fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "30px" }}>
          Set new password
        </h1>
        <p style={{ margin: 0, color: "#a89690", fontSize: "13px", lineHeight: 1.6 }}>
          Enter your new password below.
        </p>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#1e1513",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#1e1513",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {error && <p style={{ margin: 0, color: "#c0392b", fontSize: "12px" }}>{error}</p>}
        {done && <p style={{ margin: 0, color: "#6fcf97", fontSize: "12px" }}>Password updated. Redirecting…</p>}

        <button
          onClick={submit}
          disabled={saving || done}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            background: "#fff",
            color: "#211817",
            fontSize: "14px",
            fontWeight: 700,
            cursor: saving || done ? "not-allowed" : "pointer",
            opacity: saving || done ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Update password"}
        </button>
      </div>
    </main>
  );
}

