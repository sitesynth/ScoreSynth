import { createBrowserClient } from "@supabase/ssr";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Use real values only if they look like valid URLs (not template placeholders)
const url = rawUrl.startsWith("http") ? rawUrl : "https://placeholder.supabase.co";
const key = rawKey.length > 20 ? rawKey : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

export function createClient() {
  return createBrowserClient(url, key);
}

export const supabaseConfigured = rawUrl.startsWith("http") && rawKey.length > 20;
