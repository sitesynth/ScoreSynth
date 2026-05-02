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

export function buildNotificationHtml(n: NotificationRecord, actorAvatarUrl?: string | null): string {
  const typeConfig: Record<string, { label: string; icon: string; ctaText: string; ctaUrl: string }> = {
    message: {
      label: "New Message",
      ctaText: "Open Messages",
      ctaUrl: "https://www.scoresynth.com/community/messages",
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    like: {
      label: "Someone liked your score",
      ctaText: "View Score",
      ctaUrl: n.score_id ? `https://www.scoresynth.com/community/${n.score_id}` : "https://www.scoresynth.com/community",
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    comment: {
      label: "New Comment",
      ctaText: "View Score",
      ctaUrl: n.score_id ? `https://www.scoresynth.com/community/${n.score_id}` : "https://www.scoresynth.com/community",
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
  };

  const config = typeConfig[n.type] ?? {
    label: "New Notification",
    ctaText: "Open ScoreSynth",
    ctaUrl: "https://www.scoresynth.com",
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };

  const avatarBlock = actorAvatarUrl
    ? `<img src="${actorAvatarUrl}" width="64" height="64" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 16px;"/>`
    : `<div style="display:inline-block;background:rgba(192,57,43,0.12);border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;margin-bottom:16px;">${config.icon}</div>`;

  const actorLine = n.actor_handle
    ? `<p style="margin:0 0 6px;font-size:13px;font-family:Arial,sans-serif;color:rgba(255,255,255,0.4);letter-spacing:1px;text-transform:uppercase;">@${n.actor_handle}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#111010;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111010;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- LOGO -->
        <tr>
          <td style="padding:0 0 24px;text-align:center;">
            <a href="https://www.scoresynth.com" style="text-decoration:none;">
              <img src="https://www.scoresynth.com/logo-scoresynth-email.png" width="180" alt="ScoreSynth" style="display:inline-block;"/>
            </a>
          </td>
        </tr>

        <!-- ICON HEADER -->
        <tr>
          <td style="background:#1d1413;border-radius:16px 16px 0 0;padding:36px 44px 28px;text-align:center;border:1px solid rgba(255,255,255,0.07);border-bottom:none;">
            ${avatarBlock}
            ${actorLine}
            <p style="margin:0 0 4px;font-size:12px;font-family:Arial,sans-serif;color:rgba(255,255,255,0.35);letter-spacing:1.5px;text-transform:uppercase;">${config.label}</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#211817;padding:0 44px 36px;border-left:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07);">
            <h1 style="margin:0 0 16px;font-size:26px;font-weight:400;color:#ffffff;line-height:1.25;text-align:center;">${n.title}</h1>
            <p style="margin:0 0 32px;font-size:15px;font-family:Arial,sans-serif;color:rgba(255,255,255,0.6);line-height:1.75;text-align:center;white-space:pre-wrap;">${n.body}</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#c0392b;border-radius:12px;">
                  <a href="${config.ctaUrl}" style="display:inline-block;padding:14px 40px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">
                    ${config.ctaText}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr>
          <td style="background:#211817;padding:0 44px;border-left:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07);">
            <div style="height:1px;background:rgba(255,255,255,0.07);"></div>
          </td>
        </tr>

        <!-- FOOTER -->
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
