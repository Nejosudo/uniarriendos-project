import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitKey, getClientIp } from '@/lib/rateLimit';
import { createClient } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(rateLimitKey(ip, user.id, 'mejorar_desc'), 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Límite 5/h' }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const desc = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
  if (!desc || desc.length < 20) return NextResponse.json({ error: 'Escribe al menos 20 caracteres antes de mejorar' }, { status: 400 });
  if (desc.length > 2000) return NextResponse.json({ error: 'Descripción muy larga' }, { status: 400 });

  const titulo = sanitizeText(typeof body.titulo === 'string' ? body.titulo : '', 100);
  const ubicacion = sanitizeText(typeof body.ubicacion_texto === 'string' ? body.ubicacion_texto : '', 150);
  const precio = typeof body.precio === 'number' || typeof body.precio === 'string'
    ? sanitizeText(String(body.precio), 20)
    : '';
  const servicios = Array.isArray(body.servicios)
    ? body.servicios
        .filter((s: unknown): s is string => typeof s === 'string')
        .map((s: string) => sanitizeText(s, 50))
        .slice(0, 15)
    : [];

  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: 'IA no configurada' }, { status: 500 });
  const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();
  const prompt = `Eres asistente inmobiliario. Reescribe esta descripción de arriendo para hacerla más formal, clara y atractiva, manteniendo datos reales, agregando 2-4 emojis decorativos relevantes (🏠✨📍). No inventes servicios. Máx 900 caracteres. Título: "${titulo}" Precio: ${precio} Ubicación: "${ubicacion}" Servicios: ${servicios.join(', ')}. Descripción original: "${desc}" Responde solo con la descripción mejorada.`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 500 } }),
    });
    if (!res.ok) {
      console.error('Error Gemini mejorar-descripcion:', res.status, (await res.text()).slice(0, 300));
      return NextResponse.json({ error: 'No se pudo procesar la solicitud' }, { status: 502 });
    }
    const j = await res.json();
    const text = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!text) return NextResponse.json({ error: 'Sin respuesta IA' }, { status: 502 });
    return NextResponse.json({ mejorada: text.slice(0, 900) });
  } catch (e) {
    console.error('Excepción Gemini mejorar-descripcion:', e);
    return NextResponse.json({ error: 'No se pudo procesar la solicitud' }, { status: 500 });
  }
}
