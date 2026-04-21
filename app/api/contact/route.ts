import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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
    html: `
      <div style="font-family: sans-serif; max-width: 600px; color: #333;">
        <h2 style="color: #1a1a1a;">New contact form submission</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; width: 160px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${firstName} ${lastName}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding: 8px 0; color: #666;">Phone</td><td style="padding: 8px 0;">${phone}</td></tr>` : ""}
          ${companyName ? `<tr><td style="padding: 8px 0; color: #666;">Company</td><td style="padding: 8px 0;">${companyName}</td></tr>` : ""}
          ${companySize ? `<tr><td style="padding: 8px 0; color: #666;">Company size</td><td style="padding: 8px 0;">${companySize}</td></tr>` : ""}
          ${interest ? `<tr><td style="padding: 8px 0; color: #666;">Interest</td><td style="padding: 8px 0;">${interest}</td></tr>` : ""}
        </table>
        ${message ? `<div style="margin-top: 16px;"><p style="color: #666; margin-bottom: 6px;">Message:</p><p style="background: #f5f5f5; padding: 12px; border-radius: 8px; white-space: pre-wrap;">${message}</p></div>` : ""}
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
