import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';

type Filters = { precioMax?: number; tipo?: string; compartida?: boolean; servicios?: string[]; ubicacion?: string; textoLibre?: string };

const cache = new Map<string, { data: any; exp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function sanitizeQ(q: string) { return q.slice(0, 200).trim(); }

async function parseWithGemini(q: string): Promise<Filters | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const prompt = `Extrae JSON estricto de filtros de arriendo. Query: "${q}". Salida JSON: {"precioMax": number|null, "tipo": "hombres"|"mujeres"|"ambos"|null, "compartida": boolean|null, "servicios": string[], "ubicacion": string|null, "textoLibre": string|null}. Servicios: wifi, parqueadero, cocina, lavanderia. Precio en COP. Solo JSON.`;
  const model = (process.env.GEMINI_MODEL || 'gemini-1.5-flash-8b').trim();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 300 } }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    return {
      precioMax: typeof parsed.precioMax === 'number' ? parsed.precioMax : undefined,
      tipo: parsed.tipo || undefined,
      compartida: typeof parsed.compartida === 'boolean' ? parsed.compartida : undefined,
      servicios: Array.isArray(parsed.servicios) ? parsed.servicios.slice(0, 5) : undefined,
      ubicacion: parsed.ubicacion || undefined,
      textoLibre: parsed.textoLibre || undefined,
    };
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const qRaw = req.nextUrl.searchParams.get('q') || '';
  const q = sanitizeQ(qRaw);
  if (!q || q.length < 3) return NextResponse.json({ error: 'Query muy corto' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = checkRateLimit(rateLimitKey(ip, null, 'search_semantic'), 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit 10/min', fallback: true }, { status: 429 });

  const cacheKey = q.toLowerCase();
  const hit = cache.get(cacheKey);
  if (hit && Date.now() < hit.exp) return NextResponse.json({ ...hit.data, cached: true });

  const supabase = await createClient();
  let filters: Filters | null = null;
  let usedGemini = false;
  try {
    filters = await parseWithGemini(q);
    if (filters) usedGemini = true;
  } catch {}

  let query = supabase.from('propiedades').select(`*, propiedades_fotos(url), servicios_rel:propiedades_servicios(servicio:servicios(nombre,icono)), anfitrion:perfiles!propiedades_propietario_id_fkey(nombre_completo,avatar_url)`).in('estado', ['disponible','ocupado']);

  if (filters?.precioMax) query = query.lte('precio', filters.precioMax);
  if (filters?.tipo) query = query.in('perfil_arriendo', [filters.tipo, 'ambos']);
  if (filters?.compartida) query = query.eq('vivienda_compartida', true);

  const { data, error } = await query.order('created_at', { ascending: false }).limit(30);
  if (error) return NextResponse.json({ error: error.message, fallback: true }, { status: 500 });

  const terms = [q, filters?.ubicacion, filters?.textoLibre].filter(Boolean).flatMap(t => t!.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const ranked = (data || []).map((prop: any) => {
    let score = 0;
    const wPrecio = 10, wTipo = 5, wComp = 5, wServ = 3, wTitulo = 3, wUbi = 2, wDesc = 1, wVerif = 2;
    if (filters?.precioMax && prop.precio <= filters.precioMax) score += wPrecio;
    else if (filters?.precioMax && prop.precio <= filters.precioMax * 1.2) score += 5;
    if (filters?.tipo && (prop.perfil_arriendo === filters.tipo || prop.perfil_arriendo === 'ambos')) score += wTipo;
    if (filters?.compartida && prop.vivienda_compartida) score += wComp;
    if (filters?.servicios?.length) {
      const propServs = (prop.servicios_rel || []).map((s: any) => s.servicio?.nombre?.toLowerCase() || '').join(' ');
      for (const srv of filters.servicios) if (propServs.includes(srv.toLowerCase())) score += wServ;
    }
    const haystack = `${prop.titulo} ${prop.ubicacion_texto} ${prop.descripcion}`.toLowerCase();
    for (const w of terms) {
      if (prop.titulo?.toLowerCase().includes(w)) score += wTitulo;
      else if (prop.ubicacion_texto?.toLowerCase().includes(w)) score += wUbi;
      else if (haystack.includes(w)) score += wDesc;
    }
    if (q.toLowerCase().includes('2 habitaciones') && haystack.includes('2 habitaciones')) score += 5;
    if (q.toLowerCase().includes('1 habitacion') && haystack.includes('1 habitacion')) score += 5;
    if (prop.verificada) score += wVerif;
    return { ...prop, _score: score };
  }).sort((a: any, b: any) => b._score - a._score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 12);

  const payload = { filtros: filters, usedGemini, resultados: ranked, q };
  cache.set(cacheKey, { data: payload, exp: Date.now() + CACHE_TTL });
  setTimeout(() => { if (cache.get(cacheKey)?.exp && Date.now() > cache.get(cacheKey)!.exp) cache.delete(cacheKey); }, CACHE_TTL + 1000);
  return NextResponse.json(payload);
}
