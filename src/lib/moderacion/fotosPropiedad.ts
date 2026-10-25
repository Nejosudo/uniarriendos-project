import type { createClient } from '@/lib/supabase/server';

export type ResultadoFoto = 'aprobada' | 'pendiente' | 'rechazada';
export type EstadoPropiedad = 'disponible' | 'ocupado' | 'inactivo';

type Supabase = Awaited<ReturnType<typeof createClient>>;

export function calcularEstadoPropiedad(
    estadoActual: EstadoPropiedad,
    resultados: ResultadoFoto[]
): EstadoPropiedad {
    if (resultados.length === 0) return estadoActual;
    if (resultados.some((resultado) => resultado === 'pendiente' || resultado === 'rechazada')) {
        return 'inactivo';
    }
    return estadoActual === 'inactivo' ? 'disponible' : estadoActual;
}

export async function recalcularEstadoPropiedad(supabase: Supabase, propiedadId: number) {
    const [{ data: fotos }, { data: validaciones }, { data: propiedad }] = await Promise.all([
        supabase.from('propiedades_fotos').select('url').eq('propiedad_id', propiedadId),
        supabase
            .from('fotos_validacion')
            .select('foto_url, resultado')
            .eq('propiedad_id', propiedadId)
            .not('foto_url', 'is', null),
        supabase.from('propiedades').select('estado').eq('id', propiedadId).maybeSingle(),
    ]);

    if (!propiedad) {
        return { estado: null, anterior: null, cambio: false };
    }

    const urlsVigentes = new Set((fotos ?? []).map((foto) => foto.url));
    const resultados = (validaciones ?? [])
        .filter((validacion) => validacion.foto_url && urlsVigentes.has(validacion.foto_url))
        .map((validacion) => validacion.resultado as ResultadoFoto);

    const anterior = propiedad.estado as EstadoPropiedad;
    const estado = calcularEstadoPropiedad(anterior, resultados);
    const cambio = estado !== anterior;

    if (cambio) {
        await supabase
            .from('propiedades')
            .update({ estado, updated_at: new Date().toISOString() })
            .eq('id', propiedadId);
    }

    return { estado, anterior, cambio };
}

export async function registrarFotosPendientes(
    supabase: Supabase,
    propiedadId: number,
    usuarioId: string,
    urls: string[]
) {
    if (urls.length === 0) return { ok: true, insertadas: 0 };

    const { data: existentes, error: selectError } = await supabase
        .from('fotos_validacion')
        .select('foto_url')
        .eq('propiedad_id', propiedadId)
        .in('foto_url', urls);

    if (selectError) {
        console.error('Error consultando validaciones existentes:', selectError);
        return { ok: false, insertadas: 0 };
    }

    const registradas = new Set((existentes ?? []).map((foto) => foto.foto_url));
    const nuevas = urls.filter((url) => !registradas.has(url));

    if (nuevas.length === 0) return { ok: true, insertadas: 0 };

    const { error } = await supabase.from('fotos_validacion').insert(
        nuevas.map((url) => ({
            usuario_id: usuarioId,
            propiedad_id: propiedadId,
            foto_url: url,
            resultado: 'pendiente',
            motivo: 'propiedad:pendiente_revision_servidor',
            scores: null,
        }))
    );

    if (error) {
        console.error('Error registrando fotos para revisión:', error);
        return { ok: false, insertadas: 0 };
    }

    return { ok: true, insertadas: nuevas.length };
}
