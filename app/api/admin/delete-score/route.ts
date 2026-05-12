import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { scoreId } = await req.json();
  if (!scoreId) {
    return NextResponse.json({ error: "scoreId is required" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === "your_service_role_key") {
    return NextResponse.json({ error: "Admin deletion is not configured." }, { status: 503 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch PDF/cover URLs before deleting the record so we can clean up storage
  const { data: score } = await adminClient
    .from("scores")
    .select("pdf_url, cover_url")
    .eq("id", scoreId)
    .single();

  const { error: deleteError } = await adminClient
    .from("scores")
    .delete()
    .eq("id", scoreId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Best-effort storage cleanup — don't fail the request if this doesn't work
  if (score) {
    const filesToDelete: string[] = [];
    const extractPath = (url: string | null) => {
      if (!url) return null;
      try {
        const u = new URL(url);
        // Supabase storage URLs: /storage/v1/object/public/<bucket>/<path>
        const match = u.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
        return match ? match[1] : null;
      } catch {
        return null;
      }
    };
    const pdfPath = extractPath(score.pdf_url);
    const coverPath = extractPath(score.cover_url);
    if (pdfPath) filesToDelete.push(pdfPath);
    if (coverPath) filesToDelete.push(coverPath);
    if (filesToDelete.length > 0) {
      await adminClient.storage.from("score-files").remove(filesToDelete);
    }
  }

  return NextResponse.json({ success: true });
}
