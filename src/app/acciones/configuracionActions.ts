'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAction } from '@/lib/admin/auth';
import { CLAVE_FEEDBACK_ACTIVO, CLAVE_PRECIO_VERIFICACION } from '@/lib/configuracion';
import { logAdminAction } from './adminAuditActions';

export async function actualizarPrecioVerificacion(valor: number) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    if (!Number.isInteger(valor) || valor <= 0) {
        return { success: false, error: 'El precio debe ser un número entero mayor a cero.' };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('configuracion').upsert(
        {
            clave: CLAVE_PRECIO_VERIFICACION,
            valor: String(valor),
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'clave' }
    );

    if (error) {
        console.error('Error actualizando el precio de verificación:', error);
        return { success: false, error: 'No se pudo guardar el precio de verificación.' };
    }

    await logAdminAction('actualizar_configuracion', 'configuracion', CLAVE_PRECIO_VERIFICACION, { valor });

    revalidatePath('/admin');
    revalidatePath('/dashboard/pqrs/nueva');
    return { success: true, valor };
}

export async function actualizarFeedbackActivo(activo: boolean) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    const supabase = await createClient();
    const valor = activo ? 'true' : 'false';
    const { error } = await supabase.from('configuracion').upsert(
        {
            clave: CLAVE_FEEDBACK_ACTIVO,
            valor,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'clave' }
    );

    if (error) {
        console.error('Error actualizando el botón de feedback:', error);
        return { success: false, error: 'No se pudo guardar la configuración de feedback.' };
    }

    await logAdminAction('actualizar_configuracion', 'configuracion', CLAVE_FEEDBACK_ACTIVO, { activo });

    revalidatePath('/', 'layout');
    revalidatePath('/admin');
    return { success: true, activo };
}
