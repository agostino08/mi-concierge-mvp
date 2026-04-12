// Vercel serverless — receives demo request from landing page and emails the founder
// Required env vars: RESEND_API_KEY, CONTACT_TO_EMAIL (defaults to agustin@consergi.com)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, hotel, email, phone, lang } = req.body || {};
  if (!name || !hotel || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('contact.js: RESEND_API_KEY not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const toEmail = process.env.CONTACT_TO_EMAIL || 'agustin@consergi.com';
  const subject = `Nueva solicitud de demo: ${hotel}`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fdfcfb;border-radius:16px;">
      <h2 style="font-size:20px;color:#1c1917;margin:0 0 24px;">
        🏨 Nueva solicitud de demo — <strong>${escHtml(hotel)}</strong>
      </h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;font-size:14px;color:#78716c;width:120px;">Hotel</td>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;font-size:14px;color:#1c1917;font-weight:600;">${escHtml(hotel)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;font-size:14px;color:#78716c;">Nombre</td>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;font-size:14px;color:#1c1917;">${escHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;font-size:14px;color:#78716c;">Email</td>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;font-size:14px;color:#1c1917;">
            <a href="mailto:${escHtml(email)}" style="color:#b45309;">${escHtml(email)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;font-size:14px;color:#78716c;">Teléfono</td>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;font-size:14px;color:#1c1917;">${phone ? escHtml(phone) : '—'}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:14px;color:#78716c;">Idioma</td>
          <td style="padding:10px 0;font-size:14px;color:#1c1917;">${escHtml(lang || 'es').toUpperCase()}</td>
        </tr>
      </table>
      <div style="margin-top:28px;padding:16px;background:#fef3c7;border-radius:12px;font-size:13px;color:#92400e;">
        💡 Responde a <a href="mailto:${escHtml(email)}" style="color:#b45309;font-weight:600;">${escHtml(email)}</a> directamente desde este email.
      </div>
      <p style="margin-top:24px;font-size:11px;color:#a8a29e;text-align:center;">Consergi · consergi.com</p>
    </div>
  `;

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Consergi <onboarding@resend.dev>',
        to: [toEmail],
        reply_to: email,
        subject,
        html,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.json().catch(() => ({}));
      console.error('contact.js resend error:', err);
      return res.status(500).json({ error: 'Email delivery failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact.js error:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
