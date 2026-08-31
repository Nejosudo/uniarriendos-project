import { containsBlocked, containsContactInfo } from './blocklist';
export type ModeracionResult = { estado: 'visible' | 'pendiente_revision' | 'oculto'; motivo?: string };
export async function moderarTexto(texto: string): Promise<ModeracionResult> {
  const blocked = containsBlocked(texto);
  if (blocked) return { estado: 'oculto', motivo: `palabra bloqueada: ${blocked}` };
  if (containsContactInfo(texto)) return { estado: 'pendiente_revision', motivo: 'contiene datos de contacto' };
  if (process.env.GEMINI_API_KEY && texto.length > 20) {
    try {
      const model = (process.env.GEMINI_MODEL || 'gemini-1.5-flash-8b').trim();
      const prompt = `Clasifica toxicidad 0-1 de: "${texto.slice(0,300)}". Responde JSON {"toxic":0.0-1.0}. Solo JSON.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY?.trim()}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 50 } }),
      });
      if (res.ok) {
        const j = await res.json();
        const t = j.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const m = t.match(/\{[\s\S]*\}/);
        if (m) {
          const p = JSON.parse(m[0]);
          if (p.toxic > 0.8) return { estado: 'pendiente_revision', motivo: 'posible toxicidad alta' };
        }
      }
    } catch {}
  }
  return { estado: 'visible' };
}
