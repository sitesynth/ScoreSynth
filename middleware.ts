import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const isConfigured =
  supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://");

function isRecentUser(createdAt?: string) {
  const ts = createdAt ? Date.parse(createdAt) : Number.NaN;
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < 24 * 60 * 60 * 1000; // 24h
}

export async function middleware(request: NextRequest) {
  // Skip if Supabase is not yet configured
  if (!isConfigured) return NextResponse.next({ request });
  const host = request.headers.get("host") ?? "";
  const isProdApex = host === "scoresynth.com";
  if (isProdApex) {
    const url = request.nextUrl.clone();
    url.host = "www.scoresynth.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session — required for @supabase/ssr
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return supabaseResponse;

  const metadata = (user.user_metadata ?? {}) as { onboarding_completed?: boolean };
  let handle: string | null = null;
  let onboardingCompleted = metadata.onboarding_completed === true;

  const profile = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile.error) {
    handle = profile.data?.handle ?? null;
    // Legacy fallback for users without metadata flag.
    if (metadata.onboarding_completed !== true && metadata.onboarding_completed !== false) {
      onboardingCompleted = !!handle && !isRecentUser((user as { created_at?: string }).created_at);
    }
  } else {
    onboardingCompleted = metadata.onboarding_completed === true;
  }

  const isOnboarding = pathname.startsWith("/onboarding");
  const isCallback = pathname.startsWith("/auth/callback");
  const isAuthContinue = pathname.startsWith("/auth/continue");
  const isApi = pathname.startsWith("/api/");
  const isHome = pathname === "/";

  if (!onboardingCompleted && !isOnboarding && !isCallback && !isAuthContinue && !isApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (onboardingCompleted && isOnboarding && handle) {
    const url = request.nextUrl.clone();
    url.pathname = `/community/user/${handle}`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isHome) {
    const url = request.nextUrl.clone();
    if (onboardingCompleted && handle) {
      url.pathname = `/community/user/${handle}`;
    } else {
      url.pathname = "/onboarding";
    }
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
