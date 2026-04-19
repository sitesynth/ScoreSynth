import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function normalizeHandle(source: string | null | undefined) {
  const raw = (source ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const compact = raw.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  if (compact.length >= 3) return compact.slice(0, 30);
  return "user";
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
      let { data: profile } = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.handle) {
        const baseHandle = normalizeHandle(
          (user.user_metadata?.handle as string | undefined) ??
          (user.email?.split("@")[0] ?? null)
        );
        const fallbackHandle = `${baseHandle.slice(0, 21)}_${user.id.replace(/-/g, "").slice(0, 8)}`.slice(0, 30);
        const displayName =
          (user.user_metadata?.display_name as string | undefined) ||
          (user.user_metadata?.full_name as string | undefined) ||
          baseHandle;
        const avatarUrl =
          (user.user_metadata?.avatar_url as string | undefined) ||
          (user.user_metadata?.picture as string | undefined) ||
          null;

        const upsertRes = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            handle: fallbackHandle,
            display_name: displayName,
            bio: "",
            avatar_url: avatarUrl,
          });

        if (upsertRes.error) {
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (serviceKey) {
            const admin = createAdminClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              serviceKey,
              { auth: { autoRefreshToken: false, persistSession: false } }
            );
            await admin
              .from("profiles")
              .upsert({
                id: user.id,
                handle: fallbackHandle,
                display_name: displayName,
                bio: "",
                avatar_url: avatarUrl,
              });
          }
        }

        const { data: ensured } = await supabase
          .from("profiles")
          .select("handle")
          .eq("id", user.id)
          .maybeSingle();
        profile = ensured ?? null;
      }

      const redirectTo = profile?.handle
        ? `${origin}/community/user/${profile.handle}`
        : `${origin}/onboarding`;

      const response = NextResponse.redirect(redirectTo);
      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
      });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/community`);
}
