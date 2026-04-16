import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeHandle(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

function handleCandidates(user: User): string[] {
  const meta = user.user_metadata ?? {};
  const fromEmail = user.email?.split("@")[0] ?? "";
  const fromName =
    typeof meta.preferred_username === "string" ? meta.preferred_username :
    typeof meta.user_name === "string" ? meta.user_name :
    typeof meta.name === "string" ? meta.name :
    typeof meta.full_name === "string" ? meta.full_name :
    "";

  const base = [meta.handle, fromName, fromEmail, "musician"]
    .map((v) => normalizeHandle(typeof v === "string" ? v : ""))
    .filter(Boolean);

  return Array.from(new Set(base));
}

async function reserveProfileHandle(
  db: SupabaseClient,
  user: User,
): Promise<string | null> {
  const meta = user.user_metadata ?? {};
  const displayName =
    (typeof meta.display_name === "string" && meta.display_name.trim()) ||
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (user.email?.split("@")[0] ?? "musician");
  const avatarUrl =
    (typeof meta.avatar_url === "string" ? meta.avatar_url : null) ||
    (typeof meta.picture === "string" ? meta.picture : null);

  const candidates = handleCandidates(user);

  for (const base of candidates) {
    for (let i = 0; i < 20; i += 1) {
      const suffix = i === 0 ? "" : String(i + 1);
      const handle = normalizeHandle(`${base}${suffix}`);
      if (!handle || handle.length < 3) continue;

      const { error } = await db.from("profiles").upsert(
        {
          id: user.id,
          handle,
          display_name: displayName,
          bio: "",
          avatar_url: avatarUrl,
        },
        { onConflict: "id" },
      );

      if (!error) return handle;

      // Another user already has this handle. Try next suffix.
      if (error.code === "23505" || error.message.toLowerCase().includes("duplicate")) {
        continue;
      }

      // Any other error: stop this base and move on.
      break;
    }
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("handle")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.handle) {
          return NextResponse.redirect(`${origin}/community/user/${profile.handle}`);
        }

        // Google OAuth sometimes lands here without a profile row.
        // Try to create a profile server-side (service role preferred).
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const writer = serviceKey && serviceKey !== "your_service_role_key"
          ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
              auth: { autoRefreshToken: false, persistSession: false },
            })
          : supabase;

        const createdHandle = await reserveProfileHandle(writer, user);
        if (createdHandle) {
          return NextResponse.redirect(`${origin}/community/user/${createdHandle}`);
        }

        // Fallback: let user choose a handle manually.
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/community`);
}
