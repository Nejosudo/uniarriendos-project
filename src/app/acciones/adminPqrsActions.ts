'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAction } from '@/lib/admin/auth';
import type { PqrsEstado } from '@/app/acciones/pqrsActions';
import { crearNotificacion } from './notificacionesActions';
import { logAdminAction } from './adminAuditActions';
import { isAllowedImageUrl, sanitizeText } from '@/lib/validation';

export async function responderPqrs(
    pqrsId: number,
    mensaje: string,
    nuevoEstado: PqrsEstado = 'resuelto',
    imagenes: string[] = []
) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    const estadosValidos: PqrsEstado[] = ['pendiente', 'en_proceso', 'resuelto'];
    if (!estadosValidos.includes(nuevoEstado)) {
        return { success: false, error: 'Estado no válido' };
    }

    if (!Array.isArray(imagenes) || imagenes.length > 3) {
        return { success: false, error: 'Puedes adjuntar máximo 3 fotos de evidencia' };
    }
    const urls = imagenes.filter((url): url is string => typeof url === 'string');
    if (urls.some((url) => url.length > 500 || !isAllowedImageUrl(url))) {
        return { success: false, error: 'URL imagen inválida' };
    }

    const texto = sanitizeText(mensaje || '', 2000);
    if (urls.length === 0 && (!texto || texto.length < 10)) {
        return { success: false, error: 'La respuesta debe tener al menos 10 caracteres o incluir una evidencia' };
    }
    const mensajeFinal = texto.trim().length > 0 ? texto : 'Evidencia adjunta';

    const supabase = await createClient();

    const { data: respuesta, error: respError } = await supabase
        .from('pqrs_respuestas')
        .insert({
            pqrs_id: pqrsId,
            admin_id: auth.user.id,
            mensaje: mensajeFinal,
            imagen_url: urls[0] ?? null,
            imagenes_url: urls,
        })
        .select('id, pqrs_id, mensaje, imagen_url, imagenes_url, usuario_id, admin_id, created_at')
        .single();

    if (respError || !respuesta) {
        console.error('Error respondiendo PQRS:', respError);
        return { success: false, error: 'No se pudo guardar la respuesta' };
    }

    const { error: estadoError } = await supabase
        .from('pqrs')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', pqrsId);

    if (estadoError) {
        console.error('Error actualizando estado PQRS:', estadoError);
        return { success: false, error: 'Respuesta guardada pero no se pudo actualizar el estado' };
    }

    // Notificar al usuario
    const { data: pqrsData } = await supabase.from('pqrs').select('usuario_id, asunto').eq('id', pqrsId).single();
    if (pqrsData?.usuario_id) {
        await crearNotificacion({
            usuarioId: pqrsData.usuario_id,
            tipo: 'pqrs_respuesta',
            titulo: 'Respuesta a tu PQRS',
            mensaje: `Un administrador respondió tu PQRS: «${pqrsData.asunto}».`,
            enlace: '/dashboard/pqrs',
            metadata: { pqrs_id: pqrsId }
        });
    }

    await logAdminAction('responder_pqrs', 'pqrs', String(pqrsId), { nuevoEstado });

    revalidatePath('/admin/pqrs');
    revalidatePath('/dashboard/pqrs');
    return { success: true, respuesta, estado: nuevoEstado };
}

export async function cambiarEstadoPqrs(pqrsId: number, nuevoEstado: PqrsEstado) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    const estadosValidos: PqrsEstado[] = ['pendiente', 'en_proceso', 'resuelto'];
    if (!estadosValidos.includes(nuevoEstado)) {
        return { success: false, error: 'Estado no válido' };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from('pqrs')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', pqrsId);

    if (error) {
        console.error('Error cambiando estado PQRS:', error);
        return { success: false, error: 'No se pudo cambiar el estado' };
    }

    await logAdminAction('cambiar_estado_pqrs', 'pqrs', String(pqrsId), { nuevoEstado });

    revalidatePath('/admin/pqrs');
    revalidatePath('/dashboard/pqrs');
    return { success: true };
}
