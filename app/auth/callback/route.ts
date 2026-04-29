import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function normalizeHandle(raw: string | null | undefined) {
  const compact = (raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (compact.length >= 3) return compact.slice(0, 30);
  return "user";
}

async function pickUniqueHandle(
  findByHandle: (handle: string) => Promise<{ id: string } | null>,
  preferred: string,
  userId: string
) {
  const base = normalizeHandle(preferred);
  const existing = await findByHandle(base);
  if (!existing || existing.id === userId) return base;

  const suffix = userId.replace(/-/g, "").slice(0, 8);
  const alt = `${base.slice(0, 21)}_${suffix}`.slice(0, 30);
  const existingAlt = await findByHandle(alt);
  if (!existingAlt || existingAlt.id === userId) return alt;

  return `${base.slice(0, 20)}_${Date.now().toString(36).slice(-9)}`.slice(0, 30);
}

function isFreshGoogleSignup(user: {
  app_metadata?: { provider?: string };
  created_at?: string;
  last_sign_in_at?: string;
}) {
  if (user.app_metadata?.provider !== "google") return false;
  const createdAt = user.created_at ? Date.parse(user.created_at) : Number.NaN;
  const lastSignInAt = user.last_sign_in_at
    ? Date.parse(user.last_sign_in_at)
    : Number.NaN;
  if (Number.isNaN(createdAt) || Number.isNaN(lastSignInAt)) return false;
  // First OAuth login: created_at and last_sign_in_at are effectively the same event.
  return Math.abs(lastSignInAt - createdAt) < 60 * 1000;
}

function isRecentUser(createdAt?: string) {
  const ts = createdAt ? Date.parse(createdAt) : Number.NaN;
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < 24 * 60 * 60 * 1000; // 24h
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach((c) => pendingCookies.push(c));
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      const freshGoogleSignup = isFreshGoogleSignup(user);
      const metadata = (user.user_metadata ?? {}) as { onboarding_completed?: boolean };
      let existingProfile: { id?: string; handle?: string | null } | null = null;
      const existing = await supabase
        .from("profiles")
        .select("id, handle")
        .eq("id", user.id)
        .maybeSingle();
      if (!existing.error) {
        existingProfile = existing.data ?? null;
      }

      const findByHandle = async (handle: string) => {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("handle", handle)
          .maybeSingle();
        return data ?? null;
      };

      const preferredHandle = (user.user_metadata?.handle as string | undefined)
        ?? `user_${user.id.replace(/-/g, "").slice(0, 8)}`;
      const handle = await pickUniqueHandle(findByHandle, preferredHandle, user.id);
      const displayName =
        (user.user_metadata?.display_name as string | undefined)
        || (user.user_metadata?.full_name as string | undefined)
        || handle;
      const avatarUrl =
        (user.user_metadata?.avatar_url as string | undefined)
        || (user.user_metadata?.picture as string | undefined)
        || null;

      let writeError: string | null = null;

      if (!existingProfile) {
        // First-time user: ensure a profile row exists.
        const payload = {
          id: user.id,
          handle,
          display_name: displayName,
          bio: "",
          avatar_url: avatarUrl,
        };
        const createResult = await supabase.from("profiles").upsert(payload);
        if (createResult.error) writeError = createResult.error.message;
      } else if (!existingProfile.handle) {
        // Existing row without handle: repair minimally, keep onboarding state untouched.
        const repairResult = await supabase
          .from("profiles")
          .update({ handle, display_name: displayName, avatar_url: avatarUrl })
          .eq("id", user.id);
        if (repairResult.error) writeError = repairResult.error.message;
      }

      // If policies or trigger are misconfigured, use service role as hard fallback.
      if (writeError) {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceKey) {
          const admin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
          );

          if (!existingProfile) {
            const adminPayload = {
              id: user.id,
              handle,
              display_name: displayName,
              bio: "",
              avatar_url: avatarUrl,
            };
            await admin.from("profiles").upsert(adminPayload);
          } else if (!existingProfile.handle) {
            await admin
              .from("profiles")
              .update({ handle, display_name: displayName, avatar_url: avatarUrl })
              .eq("id", user.id);
          }
        }
      }

      if (freshGoogleSignup && metadata.onboarding_completed !== false) {
        await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            onboarding_completed: false,
          },
        });
      }

      let redirectTo = `${origin}/onboarding`;
      if (freshGoogleSignup) {
        redirectTo = `${origin}/onboarding`;
      } else if (metadata.onboarding_completed === true && existingProfile?.handle) {
        redirectTo = `${origin}/community/user/${existingProfile.handle}`;
      } else if (metadata.onboarding_completed !== false && existingProfile?.handle && !isRecentUser((user as { created_at?: string }).created_at)) {
        redirectTo = `${origin}/community/user/${existingProfile.handle}`;
      } else {
        redirectTo = `${origin}/onboarding`;
      }

      const response = NextResponse.redirect(redirectTo);
      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
      });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/community`);
}
