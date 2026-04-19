import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const isConfigured =
  supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://");

export async function middleware(request: NextRequest) {
  // Skip if Supabase is not yet configured
  if (!isConfigured) return NextResponse.next({ request });
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

  let handle: string | null = null;
  let onboardingCompleted = false;

  // Prefer explicit onboarding flag; tolerate old schema during rollout.
  const profileWithFlag = await supabase
    .from("profiles")
    .select("handle, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileWithFlag.error) {
    handle = profileWithFlag.data?.handle ?? null;
    onboardingCompleted = profileWithFlag.data?.onboarding_completed === true;
  } else {
    const profileFallback = await supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .maybeSingle();
    handle = profileFallback.data?.handle ?? null;
    onboardingCompleted = !!handle;
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
