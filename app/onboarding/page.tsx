"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const force = searchParams.get("force") === "1";

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/"); return; }
      setUserId(user.id);

      // Check if already has profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, handle, display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (existingProfile?.handle && !force) {
        router.push(`/community/user/${existingProfile.handle}`);
        return;
      }

      const meta = user.user_metadata;

      // If signup metadata has handle — auto-create profile, no form needed
      if (meta?.handle) {
        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          handle: meta.handle,
          display_name: meta.display_name || meta.handle,
          bio: "",
          avatar_url: meta.avatar_url || meta.picture || null,
        });
        if (!error) {
          router.push(`/community/user/${meta.handle}`);
          return;
        }
      }

      // Google / fallback — pre-fill form
      if (meta?.full_name) setDisplayName(meta.full_name);
      else if (meta?.name) setDisplayName(meta.name);
      else if (existingProfile?.display_name) setDisplayName(existingProfile.display_name);

      const emailHandle = user.email?.split("@")[0]
        ?.replace(/[^a-z0-9_]/gi, "")
        ?.toLowerCase()
        ?.slice(0, 20) ?? "";
      if (existingProfile?.handle) {
        setHandle(existingProfile.handle);
        setPrefilled(true);
      } else if (emailHandle) {
        setHandle(emailHandle);
        setPrefilled(true);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [force]);

  const validateHandle = (val: string) => {
    if (!val) return "Handle is required.";
    if (val.length < 3) return "At least 3 characters.";
    if (val.length > 30) return "Max 30 characters.";
    if (!/^[a-z0-9_]+$/.test(val)) return "Only lowercase letters, numbers, underscores.";
    return null;
  };

  const checkHandle = async (val: string) => {
    const err = validateHandle(val);
    if (err) { setHandleError(err); return; }
    setChecking(true);
    const { data } = await supabase
      .from("profiles").select("id").eq("handle", val).maybeSingle();
    setChecking(false);
    setHandleError(data && data.id !== userId ? "This handle is already taken." : null);
  };

  const handleSubmit = async () => {
    const err = validateHandle(handle);
    if (err) { setHandleError(err); return; }
    if (handleError) return;
    if (!userId) return;
    setSaving(true);

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const avatarUrl = currentUser?.user_metadata?.avatar_url
      || currentUser?.user_metadata?.picture
      || null;

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      handle: handle.toLowerCase(),
      display_name: displayName.trim() || handle,
      bio: "",
      avatar_url: avatarUrl,
    });

    setSaving(false);
    if (error) { setHandleError(error.message); return; }
    router.push(`/community/user/${handle.toLowerCase()}`);
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
        display: "flex",
        flexDirection: "column",
        gap: "32px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center" }}>
          <Image src="/logo.svg" alt="ScoreSynth" width={40} height={40} style={{ margin: "0 auto 16px" }} />
          <h1 style={{
            fontFamily: "Georgia, serif",
            fontSize: "28px",
            color: "#fff",
            fontWeight: 400,
            marginBottom: "8px",
          }}>
            Welcome to ScoreSynth
          </h1>
          <p style={{ fontSize: "14px", color: "#a89690" }}>
            Set up your profile to get started.
          </p>
        </div>

        {/* Form */}
        <div style={{
          background: "#2a1f1e",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>
          {/* Display name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "12px", color: "#a89690" }}>Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                background: "#1e1513",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Handle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "12px", color: "#a89690" }}>
              Username <span style={{ color: "#6b5452" }}>(used in your profile URL)</span>
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "14px", top: "50%",
                transform: "translateY(-50%)",
                fontSize: "14px", color: "#6b5452",
                pointerEvents: "none",
              }}>@</span>
              <input
                type="text"
                value={handle}
                onChange={e => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                  setHandle(val);
                  setHandleError(null);
                }}
                onBlur={() => checkHandle(handle)}
                placeholder="yourhandle"
                maxLength={30}
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 28px",
                  borderRadius: "10px",
                  background: "#1e1513",
                  border: `1px solid ${handleError ? "#c0392b" : handle && !handleError && !checking ? "rgba(100,200,100,0.3)" : "rgba(255,255,255,0.1)"}`,
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
              />
            </div>
            {handleError && (
              <p style={{ fontSize: "12px", color: "#c0392b" }}>{handleError}</p>
            )}
            {checking && (
              <p style={{ fontSize: "12px", color: "#6b5452" }}>Checking availability…</p>
            )}
            {!handleError && !checking && handle.length >= 3 && (
              <p style={{ fontSize: "12px", color: "#6b8f6b" }}>
                ✓ scoresynth.com/community/user/{handle}
              </p>
            )}
            {prefilled && (
              <p style={{ fontSize: "11px", color: "#6b5452" }}>
                Suggested from your email — feel free to change it.
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !!handleError || checking || !handle}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "10px",
              background: saving || !!handleError || checking || !handle ? "rgba(255,255,255,0.15)" : "#fff",
              color: saving || !!handleError || checking || !handle ? "#6b5452" : "#211817",
              fontSize: "14px",
              fontWeight: 600,
              cursor: saving || !!handleError || checking || !handle ? "not-allowed" : "pointer",
              border: "none",
              transition: "all 0.15s",
            }}
          >
            {saving ? "Creating profile…" : "Get started →"}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#6b5452" }}>
          You can change your display name and add a bio later in your profile settings.
        </p>
      </div>
    </main>
  );
}
