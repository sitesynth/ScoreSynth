import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next");

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

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${url.origin}/`);
  }

  const { error } = await supabase.auth.verifyOtp({
    type: type as "recovery" | "signup" | "invite" | "email_change" | "email",
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(`${url.origin}/?auth_error=invalid_or_expired_link`);
  }

  let redirectTo = `${url.origin}/auth/continue`;
  if (type === "recovery") {
    redirectTo = `${url.origin}/auth/reset-password`;
  } else if (next && next.startsWith("/")) {
    redirectTo = `${url.origin}${next}`;
  }

  const response = NextResponse.redirect(redirectTo);
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });
  return response;
}

