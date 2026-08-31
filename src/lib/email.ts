type EmailOpts = { to: string; subject: string; html: string; text?: string };
export async function sendEmail(opts: EmailOpts): Promise<{ ok: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.RESEND_FROM || 'UniArriendos <no-reply@uniarriendos.com>', to: opts.to, subject: opts.subject, html: opts.html, text: opts.text }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error('Resend error', t);
        return { ok: false, error: t };
      }
      return { ok: true };
    } catch (e: any) {
      console.error('sendEmail error', e);
      return { ok: false, error: e.message };
    }
  }
  console.log('[email stub] To:', opts.to, 'Subject:', opts.subject);
  return { ok: true };
}
export function emailTemplate(titulo: string, mensaje: string, enlace?: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `<div style="font-family:sans-serif;max-width:600px"><h2>${titulo}</h2><p>${mensaje}</p>${enlace ? `<p><a href="${base}${enlace}" style="background:#2563eb;color:white;padding:10px 16px;border-radius:8px;text-decoration:none">Ver en UniArriendos</a></p>` : ''}<p style="color:#64748b;font-size:12px">Si no deseas estos correos, ignora este mensaje. Responde a este correo para soporte.</p></div>`;
}
