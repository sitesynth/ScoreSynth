import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await req.json();
  if (!commentId) {
    return NextResponse.json({ error: "commentId is required" }, { status: 400 });
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

  // Fetch the comment to verify the caller has permission
  const { data: comment } = await adminClient
    .from("comments")
    .select("id, author_id, score_id")
    .eq("id", commentId)
    .single();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const isCommentAuthor = user.id === comment.author_id;

  // Check if caller is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  // Check if caller is the score author
  const { data: score } = await adminClient
    .from("scores")
    .select("author_id")
    .eq("id", comment.score_id)
    .single();
  const isScoreAuthor = score?.author_id === user.id;

  if (!isCommentAuthor && !isScoreAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: deleteError } = await adminClient
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
