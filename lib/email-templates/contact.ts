type ContactFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  companySize?: string;
  interest?: string;
  message?: string;
};

export function buildContactHtml(f: ContactFields): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;color:#333;">
      <h2 style="color:#1a1a1a;">New contact form submission</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#666;width:160px;">Name</td><td style="padding:8px 0;font-weight:600;">${f.firstName} ${f.lastName}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${f.email}">${f.email}</a></td></tr>
        ${f.phone ? `<tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${f.phone}</td></tr>` : ""}
        ${f.companyName ? `<tr><td style="padding:8px 0;color:#666;">Company</td><td style="padding:8px 0;">${f.companyName}</td></tr>` : ""}
        ${f.companySize ? `<tr><td style="padding:8px 0;color:#666;">Company size</td><td style="padding:8px 0;">${f.companySize}</td></tr>` : ""}
        ${f.interest ? `<tr><td style="padding:8px 0;color:#666;">Interest</td><td style="padding:8px 0;">${f.interest}</td></tr>` : ""}
      </table>
      ${f.message ? `<div style="margin-top:16px;"><p style="color:#666;margin-bottom:6px;">Message:</p><p style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap;">${f.message}</p></div>` : ""}
    </div>
  `;
}
