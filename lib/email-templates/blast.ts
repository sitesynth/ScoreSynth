export const BLAST_SUBJECT = "A note from ScoreSynth";
export const BLAST_BODY = `Hi! Thank you for being part of ScoreSynth. Every day we upload new sheet music to the community, and we're also working on a browser-based score editor and new tools for transcription and AI composition — more on that soon.\n\nWe also want to let you know that we've updated our profile security. Your public handle was changed — the previous one could reveal part of your email address. You can choose a new handle in your profile settings.\n\n— The ScoreSynth Team`;

export function buildBlastHtml(body: string, title: string): string {
  const lines = body.split("\n\n").map(p =>
    `<p style="margin:0 0 20px;font-size:15px;font-family:Arial,sans-serif;color:rgba(255,255,255,0.6);line-height:1.75;text-align:center;">${p.replace(/\n/g, "<br/>")}</p>`
  ).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#111010;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111010;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="padding:0 0 24px;text-align:center;">
            <a href="https://www.scoresynth.com" style="text-decoration:none;">
              <img src="https://www.scoresynth.com/logo-scoresynth-email.png" width="180" alt="ScoreSynth" style="display:inline-block;"/>
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#1d1413;border-radius:16px 16px 0 0;padding:36px 44px 28px;text-align:center;border:1px solid rgba(255,255,255,0.07);border-bottom:none;">
            <p style="margin:0 0 4px;font-size:12px;font-family:Arial,sans-serif;color:rgba(255,255,255,0.35);letter-spacing:1.5px;text-transform:uppercase;">Update from ScoreSynth</p>
          </td>
        </tr>
        <tr>
          <td style="background:#211817;padding:0 44px 36px;border-left:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07);">
            <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:#ffffff;line-height:1.25;text-align:center;">${title}</h1>
            ${lines}
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#c0392b;border-radius:12px;">
                  <a href="https://www.scoresynth.com/community" style="display:inline-block;padding:14px 40px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">
                    Open ScoreSynth
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#211817;padding:0 44px;border-left:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07);">
            <div style="height:1px;background:rgba(255,255,255,0.07);"></div>
          </td>
        </tr>
        <tr>
          <td style="background:#1a1210;border-radius:0 0 16px 16px;padding:24px 44px 32px;border:1px solid rgba(255,255,255,0.07);border-top:none;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;font-family:Arial,sans-serif;color:rgba(255,255,255,0.25);">
              &copy; 2026 ScoreSynth &nbsp;&middot;&nbsp;
              <a href="https://www.scoresynth.com" style="color:rgba(255,255,255,0.4);text-decoration:none;">scoresynth.com</a>
              &nbsp;&middot;&nbsp;
              <a href="https://www.scoresynth.com/privacy" style="color:rgba(255,255,255,0.4);text-decoration:none;">Privacy</a>
            </p>
            <p style="margin:0;font-size:11px;font-family:Arial,sans-serif;color:rgba(255,255,255,0.15);">
              You received this because you have an account on ScoreSynth.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
