'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { notificarAdmins } from './notificacionesActions';
import { sanitizeText, validateTextoLargo } from '@/lib/validation';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';

export type PqrsTipo = 'peticion' | 'queja' | 'reclamo' | 'sugerencia';
export type PqrsEstado = 'pendiente' | 'en_proceso' | 'resuelto';

const TIPOS_VALIDOS: PqrsTipo[] = ['peticion', 'queja', 'reclamo', 'sugerencia'];

interface CrearPqrsInput {
    tipo: PqrsTipo;
    asunto: string;
    mensaje: string;
}

export async function crearPqrs(input: CrearPqrsInput) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Usuario no autorizado' };
    }

    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const rl = checkRateLimit(rateLimitKey(ip, user.id, 'pqrs'), 3, 60 * 60 * 1000)
    if (!rl.ok) return { success: false, error: 'Límite de PQRS alcanzado. Intenta en una hora.' }

    const asunto = sanitizeText(input.asunto || '', 150);
    const mensaje = sanitizeText(input.mensaje || '', 2000);
    const { moderarTexto } = await import('@/lib/moderacion/check');
    const modA = await moderarTexto(asunto);
    const modM = await moderarTexto(mensaje);
    const mod = modA.estado !== 'visible' ? modA : modM;
    if (mod.estado === 'oculto') return { success: false, error: 'Contenido no permitido en PQRS.' };

    if (!TIPOS_VALIDOS.includes(input.tipo)) {
        return { success: false, error: 'Tipo de PQRS no válido' };
    }

    const eA = validateTextoLargo(asunto, 5, 150, 'Asunto')
    if (eA) return { success: false, error: eA }
    const eM = validateTextoLargo(mensaje, 20, 2000, 'Mensaje')
    if (eM) return { success: false, error: eM }

    const { data, error } = await supabase
        .from('pqrs')
        .insert({
            usuario_id: user.id,
            tipo: input.tipo,
            asunto,
            mensaje,
            estado: 'pendiente',
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creando PQRS:', error);
        return { success: false, error: 'No se pudo enviar tu solicitud. Intenta de nuevo.' };
    }

    // Notificar a los administradores
    const { data: perfil } = await supabase.from('perfiles').select('nombre_completo').eq('id', user.id).single();
    await notificarAdmins({
        tipo: 'pqrs_nueva',
        titulo: 'Nueva PQRS',
        mensaje: `Nueva ${input.tipo} de ${perfil?.nombre_completo || 'un usuario'}: «${asunto}».`,
        enlace: '/admin/pqrs',
        metadata: { pqrs_id: data.id }
    });

    revalidatePath('/dashboard/pqrs');

    return { success: true, pqrsId: data.id };
}

export async function responderPqrsUsuario(pqrsId: number, mensaje: string, imagenUrl?: string | null) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };
    const texto = sanitizeText(mensaje || '', 2000);
    const eM = validateTextoLargo(texto, 10, 2000, 'Mensaje');
    if (eM) return { success: false, error: eM };
    if (imagenUrl && imagenUrl.length > 500) return { success: false, error: 'URL imagen inválida' };
    const { data: pqrs, error: pqErr } = await supabase.from('pqrs').select('id, usuario_id').eq('id', pqrsId).single();
    if (pqErr || !pqrs || pqrs.usuario_id !== user.id) return { success: false, error: 'PQRS no encontrada' };
    const { error } = await supabase.from('pqrs_respuestas').insert({ pqrs_id: pqrsId, usuario_id: user.id, mensaje: texto, imagen_url: imagenUrl || null } as any);
    if (error) return { success: false, error: 'No se pudo enviar respuesta' };
    await supabase.from('pqrs').update({ estado: 'en_proceso', updated_at: new Date().toISOString() }).eq('id', pqrsId);
    await notificarAdmins({ tipo: 'pqrs_respuesta_usuario', titulo: 'Respuesta PQRS usuario', mensaje: `Usuario respondió PQRS #${pqrsId}: «${texto.slice(0, 60)}»`, enlace: '/admin/pqrs', metadata: { pqrs_id: pqrsId } });
    revalidatePath('/dashboard/pqrs');
    revalidatePath('/admin/pqrs');
    return { success: true };
}

export async function obtenerMisPqrs() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Usuario no autorizado', pqrs: [] };
    }

    const { data, error } = await supabase
        .from('pqrs')
        .select(`
            id,
            tipo,
            asunto,
            mensaje,
            estado,
            created_at,
            updated_at,
            pqrs_respuestas (
                id,
                mensaje,
                imagen_url,
                created_at,
                admin_id,
                usuario_id
            )
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error obteniendo PQRS:', error);
        return { success: false, error: 'Error al cargar tus solicitudes', pqrs: [] };
    }

    return { success: true, pqrs: data || [] };
}
