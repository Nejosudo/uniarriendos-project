'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAction } from '@/lib/admin/auth';
import type { PqrsEstado } from '@/app/acciones/pqrsActions';

export async function responderPqrs(
    pqrsId: number,
    mensaje: string,
    nuevoEstado: PqrsEstado = 'resuelto'
) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    const texto = mensaje?.trim();
    if (!texto || texto.length < 10) {
        return { success: false, error: 'La respuesta debe tener al menos 10 caracteres' };
    }

    const estadosValidos: PqrsEstado[] = ['pendiente', 'en_proceso', 'resuelto'];
    if (!estadosValidos.includes(nuevoEstado)) {
        return { success: false, error: 'Estado no válido' };
    }

    const supabase = await createClient();

    const { error: respError } = await supabase.from('pqrs_respuestas').insert({
        pqrs_id: pqrsId,
        admin_id: auth.user.id,
        mensaje: texto,
    });

    if (respError) {
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

    revalidatePath('/admin/pqrs');
    revalidatePath('/dashboard/pqrs');
    return { success: true };
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

    revalidatePath('/admin/pqrs');
    revalidatePath('/dashboard/pqrs');
    return { success: true };
}
