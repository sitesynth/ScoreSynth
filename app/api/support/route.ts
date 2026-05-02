import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { buildSupportHtml } from "@/lib/email-templates/support";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email, subject, message } = await req.json();

  if (!email || !subject || !message?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "ScoreSynth <noreply@scoresynth.com>",
    to: "support@scoresynth.com",
    replyTo: email,
    subject: `[Support] ${subject}`,
    html: buildSupportHtml({ email, subject, message }),
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
