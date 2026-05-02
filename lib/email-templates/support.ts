type SupportFields = {
  email: string;
  subject: string;
  message: string;
};

export function buildSupportHtml(f: SupportFields): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;color:#333;">
      <h2 style="color:#1a1a1a;">Support request</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#666;width:120px;">From</td><td style="padding:8px 0;"><a href="mailto:${f.email}">${f.email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666;">Subject</td><td style="padding:8px 0;font-weight:600;">${f.subject}</td></tr>
      </table>
      <div style="margin-top:16px;">
        <p style="color:#666;margin-bottom:6px;">Message:</p>
        <p style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap;">${f.message}</p>
      </div>
    </div>
  `;
}
