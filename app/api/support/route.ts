import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, subject, message } = await req.json();

  if (!email || !subject || !message?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: "ScoreSynth Support", email: "hello@sitesynth.com" },
      to: [{ email: "support@scoresynth.com", name: "ScoreSynth Support" }],
      replyTo: { email },
      subject: `[Support] ${subject}`,
      htmlContent: `
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
    }),
  });

  if (!res.ok) {
    console.error("Brevo support error:", await res.text());
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
