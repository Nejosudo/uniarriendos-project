import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = checkRateLimit(rateLimitKey(ip, null, 'mejorar_desc'), 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Límite 5/h' }, { status: 429 });
  const { descripcion, titulo, precio, ubicacion_texto, servicios } = await req.json();
  const desc = (descripcion || '').trim();
  if (!desc || desc.length < 20) return NextResponse.json({ error: 'Escribe al menos 20 caracteres antes de mejorar' }, { status: 400 });
  if (desc.length > 2000) return NextResponse.json({ error: 'Descripción muy larga' }, { status: 400 });
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: 'IA no configurada' }, { status: 500 });
  const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();
  const prompt = `Eres asistente inmobiliario. Reescribe esta descripción de arriendo para hacerla más formal, clara y atractiva, manteniendo datos reales, agregando 2-4 emojis decorativos relevantes (🏠✨📍). No inventes servicios. Máx 900 caracteres. Título: "${titulo || ''}" Precio: ${precio || ''} Ubicación: "${ubicacion_texto || ''}" Servicios: ${(servicios || []).join(', ')}. Descripción original: "${desc}" Responde solo con la descripción mejorada.`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 500 } }),
    });
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: 'Gemini error', detail: t.slice(0, 300) }, { status: 502 });
    }
    const j = await res.json();
    const text = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!text) return NextResponse.json({ error: 'Sin respuesta IA' }, { status: 502 });
    return NextResponse.json({ mejorada: text.slice(0, 900) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
