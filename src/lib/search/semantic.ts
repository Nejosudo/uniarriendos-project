import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';
import type { PropiedadLista } from '@/lib/tipos';

export type SemanticFilters = { precioMax?: number; tipo?: 'hombres'|'mujeres'|'ambos'; compartida?: boolean; servicios?: string[]; ubicacion?: string; textoLibre?: string };
export type SemanticPayload = { filtros: SemanticFilters | null; usedGemini: boolean; resultados: PropiedadLista[]; q: string; cached?: boolean };
export type SemanticResult = SemanticPayload | { error: string; fallback?: boolean };

type CacheEntry = { data: SemanticPayload; exp: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

type GeminiParseResponse = { candidates?: { content?: { parts?: { text?: string }[] } | null }[] | null };

async function parseWithGemini(q: string): Promise<SemanticFilters | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const prompt = `Extrae JSON estricto de filtros de arriendo. Query: "${q}". Salida JSON: {"precioMax": number|null, "tipo": "hombres"|"mujeres"|"ambos"|null, "compartida": boolean|null, "servicios": string[], "ubicacion": string|null, "textoLibre": string|null}. Servicios: wifi, parqueadero, cocina, lavanderia. Precio en COP. Solo JSON.`;
  const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 300 } }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json: GeminiParseResponse = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as Partial<SemanticFilters>;
    const tipo = typeof parsed.tipo === 'string' && ['hombres','mujeres','ambos'].includes(parsed.tipo) ? parsed.tipo : undefined;
    const servicios = Array.isArray(parsed.servicios)
      ? parsed.servicios.filter((s: unknown): s is string => typeof s === 'string').map((s: string) => s.slice(0,40)).slice(0,5)
      : undefined;
    return {
      precioMax: typeof parsed.precioMax === 'number' && Number.isFinite(parsed.precioMax) && parsed.precioMax > 0 ? parsed.precioMax : undefined,
      tipo,
      compartida: typeof parsed.compartida === 'boolean' ? parsed.compartida : undefined,
      servicios,
      ubicacion: typeof parsed.ubicacion === 'string' ? parsed.ubicacion.slice(0,100) : undefined,
      textoLibre: typeof parsed.textoLibre === 'string' ? parsed.textoLibre.slice(0,100) : undefined
    };
  } catch { return null; }
}

export async function searchSemantic(q: string, ip: string | null): Promise<SemanticResult> {
  const clean = q.slice(0,200).trim();
  if (!clean || clean.length < 3) return { error: 'Query muy corto' };
  const rl = checkRateLimit(rateLimitKey(ip, null, 'search_semantic'), 10, 60000);
  if (!rl.ok) return { error: 'Rate limit 10/min', fallback: true };
  const key = clean.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() < hit.exp) return { ...hit.data, cached: true };
  const supabase = await createClient();
  let filtros: SemanticFilters | null = null;
  let usedGemini = false;
  try { filtros = await parseWithGemini(clean); if (filtros) usedGemini = true; } catch {}
  let query = supabase.from('propiedades').select(`*, propiedades_fotos(url), servicios_rel:propiedades_servicios(servicio:servicios(nombre,icono)), anfitrion:perfiles!propiedades_propietario_id_fkey(nombre_completo,avatar_url)`).in('estado', ['disponible','ocupado']);
  if (filtros?.precioMax) query = query.lte('precio', filtros.precioMax);
  if (filtros?.tipo) query = query.in('perfil_arriendo', [filtros.tipo, 'ambos']);
  if (filtros?.compartida) query = query.eq('vivienda_compartida', true);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(30);
  if (error) {
    console.error('Error búsqueda semántica:', error);
    return { error: 'No se pudo realizar la búsqueda', fallback: true };
  }
  const terms = [clean, filtros?.ubicacion, filtros?.textoLibre].filter(Boolean).flatMap(t => t!.toLowerCase().split(/\s+/).filter(w=>w.length>2));
  const ranked = (data||[]).map((prop: PropiedadLista)=>{
    let score=0;
    const wPrecio=10,wTipo=5,wComp=5,wServ=3,wTitulo=3,wUbi=2,wDesc=1,wVerif=2;
    if (filtros?.precioMax && prop.precio <= filtros.precioMax) score+=wPrecio; else if (filtros?.precioMax && prop.precio <= filtros.precioMax*1.2) score+=5;
    if (filtros?.tipo && (prop.perfil_arriendo===filtros.tipo || prop.perfil_arriendo==='ambos')) score+=wTipo;
    if (filtros?.compartida && prop.vivienda_compartida) score+=wComp;
    if (filtros?.servicios?.length){const s=(prop.servicios_rel||[]).map((x: { servicio: { nombre?: string } | null })=>x.servicio?.nombre?.toLowerCase()).join(' '); for(const srv of filtros.servicios) if(s.includes(srv.toLowerCase())) score+=wServ;}
    const haystack=`${prop.titulo} ${prop.ubicacion_texto} ${prop.descripcion}`.toLowerCase();
    for(const w of terms){ if(prop.titulo?.toLowerCase().includes(w)) score+=wTitulo; else if(prop.ubicacion_texto?.toLowerCase().includes(w)) score+=wUbi; else if(haystack.includes(w)) score+=wDesc; }
    if(clean.toLowerCase().includes('2 habitaciones') && haystack.includes('2 habitaciones')) score+=5;
    if(clean.toLowerCase().includes('1 habitacion') && haystack.includes('1 habitacion')) score+=5;
    if(prop.verificada) score+=wVerif;
    return {...prop,_score:score};
  }).sort((a: PropiedadLista, b: PropiedadLista)=>(b._score ?? 0)-(a._score ?? 0) || new Date(b.created_at ?? '').getTime()-new Date(a.created_at ?? '').getTime()).slice(0,12);
  const payload={filtros, usedGemini, resultados: ranked, q: clean};
  if (cache.size > 500) cache.clear();
  cache.set(key,{data:payload,exp:Date.now()+CACHE_TTL});
  setTimeout(()=>{if(cache.get(key)?.exp && Date.now()>cache.get(key)!.exp) cache.delete(key);},CACHE_TTL+1000);
  return payload;
}
