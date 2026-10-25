'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAction } from '@/lib/admin/auth';
import { logAdminAction } from './adminAuditActions';

async function obtenerResena(id: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('resenas')
        .select('id, propiedad_id, reportada')
        .eq('id', id)
        .maybeSingle();

    if (error || !data) return null;
    return data;
}

function revalidarResena(propiedadId?: number) {
    revalidatePath('/admin/resenas');
    revalidatePath('/explorar');
    revalidatePath('/');
    if (propiedadId) revalidatePath(`/propiedades/${propiedadId}`);
}

export async function adminAprobarResena(resenaId: number) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    if (!Number.isInteger(resenaId) || resenaId <= 0) {
        return { success: false, error: 'Reseña no válida' };
    }

    const resena = await obtenerResena(resenaId);
    if (!resena) return { success: false, error: 'La reseña no existe' };

    const supabase = await createClient();
    const { error } = await supabase
        .from('resenas')
        .update({ reportada: false })
        .eq('id', resenaId);

    if (error) {
        console.error('Error aprobando reseña:', error);
        return { success: false, error: 'No se pudo aprobar la reseña. Verifica la migración 015.' };
    }

    await logAdminAction('aprobar_resena', 'resenas', String(resenaId), {
        propiedad_id: resena.propiedad_id,
    });
    revalidarResena(resena.propiedad_id);
    return { success: true };
}

export async function adminOcultarResena(resenaId: number) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    if (!Number.isInteger(resenaId) || resenaId <= 0) {
        return { success: false, error: 'Reseña no válida' };
    }

    const resena = await obtenerResena(resenaId);
    if (!resena) return { success: false, error: 'La reseña no existe' };

    const supabase = await createClient();
    const { error } = await supabase
        .from('resenas')
        .update({ reportada: true })
        .eq('id', resenaId);

    if (error) {
        console.error('Error ocultando reseña:', error);
        return { success: false, error: 'No se pudo ocultar la reseña. Verifica la migración 015.' };
    }

    await logAdminAction('ocultar_resena', 'resenas', String(resenaId), {
        propiedad_id: resena.propiedad_id,
    });
    revalidarResena(resena.propiedad_id);
    return { success: true };
}

export async function adminEliminarResena(resenaId: number) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    if (!Number.isInteger(resenaId) || resenaId <= 0) {
        return { success: false, error: 'Reseña no válida' };
    }

    const resena = await obtenerResena(resenaId);
    if (!resena) return { success: false, error: 'La reseña no existe' };

    const supabase = await createClient();
    const { error } = await supabase
        .from('resenas')
        .delete()
        .eq('id', resenaId);

    if (error) {
        console.error('Error eliminando reseña:', error);
        return { success: false, error: 'No se pudo eliminar la reseña. Verifica la migración 015.' };
    }

    await logAdminAction('eliminar_resena', 'resenas', String(resenaId), {
        propiedad_id: resena.propiedad_id,
        reportada: resena.reportada,
    });
    revalidarResena(resena.propiedad_id);
    return { success: true };
}
