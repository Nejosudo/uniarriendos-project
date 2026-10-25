import { getSiteUrl } from '@/lib/siteUrl';

type EmailOpts = { to: string; subject: string; html: string; text?: string };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

function enlaceSeguro(enlace?: string): string | null {
  if (!enlace) return null;
  if (!enlace.startsWith('/') || enlace.startsWith('//')) return null;
  return enlace.slice(0, 500);
}

export async function sendEmail(opts: EmailOpts): Promise<{ ok: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  const subject = opts.subject.replace(/[\r\n]+/g, ' ').slice(0, 200);

  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.RESEND_FROM || 'UniArriendos <no-reply@uniarriendos.com>', to: opts.to, subject, html: opts.html, text: opts.text }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error('Resend error', res.status, t.slice(0, 300));
        return { ok: false, error: 'No se pudo enviar el correo' };
      }
      return { ok: true };
    } catch (e) {
      console.error('sendEmail error', e);
      return { ok: false, error: 'No se pudo enviar el correo' };
    }
  }

  console.log('[email stub] To:', opts.to.replace(/(.{2}).*(@.*)/, '$1***$2'), 'Subject:', subject);
  return { ok: true };
}

export function emailTemplate(titulo: string, mensaje: string, enlace?: string) {
  const base = getSiteUrl();
  const safeEnlace = enlaceSeguro(enlace);
  const href = safeEnlace ? `${base.replace(/\/$/, '')}${safeEnlace}` : null;

  return `<div style="font-family:sans-serif;max-width:600px"><h2>${escapeHtml(titulo)}</h2><p>${escapeHtml(mensaje)}</p>${href ? `<p><a href="${escapeHtml(href)}" style="background:#2563eb;color:white;padding:10px 16px;border-radius:8px;text-decoration:none">Ver en UniArriendos</a></p>` : ''}<p style="color:#64748b;font-size:12px">Si no deseas estos correos, ignora este mensaje. Responde a este correo para soporte.</p></div>`;
}
