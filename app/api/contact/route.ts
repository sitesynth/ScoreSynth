import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { buildContactHtml } from "@/lib/email-templates/contact";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companySize, companyName, firstName, lastName, email, phone, interest, message } = body;

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "ScoreSynth <noreply@scoresynth.com>",
    to: "hello@sitesynth.com",
    replyTo: email,
    subject: `New message from ${firstName} ${lastName}${companyName ? ` (${companyName})` : ""}`,
    html: buildContactHtml({ firstName, lastName, email, phone, companyName, companySize, interest, message }),
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
