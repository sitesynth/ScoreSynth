import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { buildInviteHtml, INVITE_SUBJECT } from "@/lib/email-templates/invite";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.NOTIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // Accept an explicit list of emails, or fall back to all registered users
  let emails: string[] = [];

  if (Array.isArray(body.emails) && body.emails.length > 0) {
    emails = body.emails;
  } else {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id");

    if (error || !profiles) {
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    for (const profile of profiles) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      const email = userData?.user?.email;
      if (email) emails.push(email);
    }
  }

  const html = buildInviteHtml();
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const email of emails) {
    const { error: sendError } = await resend.emails.send({
      from: "ScoreSynth <noreply@scoresynth.com>",
      to: email,
      subject: INVITE_SUBJECT,
      html,
    });

    if (sendError) {
      results.failed++;
      results.errors.push(`${email}: ${sendError.message}`);
    } else {
      results.sent++;
    }
  }

  return NextResponse.json(results);
}
