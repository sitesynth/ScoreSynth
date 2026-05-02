import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { buildNotificationHtml } from "@/lib/email-templates/notification";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

type NotificationRecord = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  score_id: string | null;
  actor_handle: string | null;
  created_at: string;
};

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.NOTIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();

  // Only handle INSERT events
  if (payload.type !== "INSERT" || !payload.record) {
    return NextResponse.json({ ok: true });
  }

  const record: NotificationRecord = payload.record;

  // Skip welcome notifications (sent on signup — no need to email)
  if (record.type === "welcome") {
    return NextResponse.json({ ok: true });
  }

  // Check user notification preferences
  const { data: prefs } = await supabaseAdmin
    .from("profiles")
    .select("email_notify_messages, email_notify_likes, email_notify_comments")
    .eq("id", record.user_id)
    .single<{ email_notify_messages: boolean; email_notify_likes: boolean; email_notify_comments: boolean }>();

  if (prefs) {
    const opted_out =
      (record.type === "message" && prefs.email_notify_messages === false) ||
      (record.type === "like"    && prefs.email_notify_likes    === false) ||
      (record.type === "comment" && prefs.email_notify_comments === false);
    if (opted_out) return NextResponse.json({ ok: true, skipped: "user opted out" });
  }

  // Get user email via admin API
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(record.user_id);

  if (userError || !userData?.user?.email) {
    console.error("notify-email: user not found", record.user_id, userError);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userEmail = userData.user.email;

  // Fetch actor avatar if available
  let actorAvatarUrl: string | null = null;
  if (record.actor_handle) {
    const { data: actorProfile } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("handle", record.actor_handle)
      .single<{ avatar_url: string | null }>();
    actorAvatarUrl = actorProfile?.avatar_url ?? null;
  }

  const { error: sendError } = await resend.emails.send({
    from: "ScoreSynth <noreply@scoresynth.com>",
    to: userEmail,
    subject: record.title,
    html: buildNotificationHtml(record, actorAvatarUrl),
  });

  if (sendError) {
    console.error("notify-email: Resend error", sendError);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
