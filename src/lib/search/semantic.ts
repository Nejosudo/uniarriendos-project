import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';

export type Filters = { precioMax?: number; tipo?: string; compartida?: boolean; servicios?: string[]; ubicacion?: string; textoLibre?: string };
const cache = new Map<string, { data: any; exp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function parseWithGemini(q: string): Promise<Filters | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const prompt = `Extrae JSON estricto de filtros de arriendo. Query: "${q}". Salida JSON: {"precioMax": number|null, "tipo": "hombres"|"mujeres"|"ambos"|null, "compartida": boolean|null, "servicios": string[], "ubicacion": string|null, "textoLibre": string|null}. Servicios: wifi, parqueadero, cocina, lavanderia. Precio en COP. Solo JSON.`;
  const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 300 } }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    return { precioMax: typeof parsed.precioMax === 'number' ? parsed.precioMax : undefined, tipo: parsed.tipo || undefined, compartida: typeof parsed.compartida === 'boolean' ? parsed.compartida : undefined, servicios: Array.isArray(parsed.servicios) ? parsed.servicios.slice(0,5):undefined, ubicacion: parsed.ubicacion || undefined, textoLibre: parsed.textoLibre || undefined };
  } catch { return null; }
}

export async function searchSemantic(q: string, ip: string | null) {
  const clean = q.slice(0,200).trim();
  if (!clean || clean.length < 3) return { error: 'Query muy corto' } as any;
  const rl = checkRateLimit(rateLimitKey(ip, null, 'search_semantic'), 10, 60000);
  if (!rl.ok) return { error: 'Rate limit 10/min', fallback: true } as any;
  const key = clean.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() < hit.exp) return { ...hit.data, cached: true };
  const supabase = await createClient();
  let filtros: Filters | null = null;
  let usedGemini = false;
  try { filtros = await parseWithGemini(clean); if (filtros) usedGemini = true; } catch {}
  let query = supabase.from('propiedades').select(`*, propiedades_fotos(url), servicios_rel:propiedades_servicios(servicio:servicios(nombre,icono)), anfitrion:perfiles!propiedades_propietario_id_fkey(nombre_completo,avatar_url)`).in('estado', ['disponible','ocupado']);
  if (filtros?.precioMax) query = query.lte('precio', filtros.precioMax);
  if (filtros?.tipo) query = query.in('perfil_arriendo', [filtros.tipo, 'ambos']);
  if (filtros?.compartida) query = query.eq('vivienda_compartida', true);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(30);
  if (error) return { error: error.message, fallback: true } as any;
  const terms = [clean, filtros?.ubicacion, filtros?.textoLibre].filter(Boolean).flatMap(t => t!.toLowerCase().split(/\s+/).filter(w=>w.length>2));
  const ranked = (data||[]).map((prop:any)=>{
    let score=0;
    const wPrecio=10,wTipo=5,wComp=5,wServ=3,wTitulo=3,wUbi=2,wDesc=1,wVerif=2;
    if (filtros?.precioMax && prop.precio <= filtros.precioMax) score+=wPrecio; else if (filtros?.precioMax && prop.precio <= filtros.precioMax*1.2) score+=5;
    if (filtros?.tipo && (prop.perfil_arriendo===filtros.tipo || prop.perfil_arriendo==='ambos')) score+=wTipo;
    if (filtros?.compartida && prop.vivienda_compartida) score+=wComp;
    if (filtros?.servicios?.length){const s=(prop.servicios_rel||[]).map((x:any)=>x.servicio?.nombre?.toLowerCase()).join(' '); for(const srv of filtros.servicios) if(s.includes(srv.toLowerCase())) score+=wServ;}
    const haystack=`${prop.titulo} ${prop.ubicacion_texto} ${prop.descripcion}`.toLowerCase();
    for(const w of terms){ if(prop.titulo?.toLowerCase().includes(w)) score+=wTitulo; else if(prop.ubicacion_texto?.toLowerCase().includes(w)) score+=wUbi; else if(haystack.includes(w)) score+=wDesc; }
    if(clean.toLowerCase().includes('2 habitaciones') && haystack.includes('2 habitaciones')) score+=5;
    if(clean.toLowerCase().includes('1 habitacion') && haystack.includes('1 habitacion')) score+=5;
    if(prop.verificada) score+=wVerif;
    return {...prop,_score:score};
  }).sort((a:any,b:any)=>b._score-a._score || new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,12);
  const payload={filtros, usedGemini, resultados: ranked, q: clean};
  cache.set(key,{data:payload,exp:Date.now()+CACHE_TTL});
  setTimeout(()=>{if(cache.get(key)?.exp && Date.now()>cache.get(key)!.exp) cache.delete(key);},CACHE_TTL+1000);
  return payload;
}
