import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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
    html: `
      <div style="font-family: sans-serif; max-width: 600px; color: #333;">
        <h2 style="color: #1a1a1a;">Support request</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; width: 120px;">From</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Subject</td><td style="padding: 8px 0; font-weight: 600;">${subject}</td></tr>
        </table>
        <div style="margin-top: 16px;">
          <p style="color: #666; margin-bottom: 6px;">Message:</p>
          <p style="background: #f5f5f5; padding: 12px; border-radius: 8px; white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
