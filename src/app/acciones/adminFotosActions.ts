'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAction } from '@/lib/admin/auth';
import { logAdminAction } from './adminAuditActions';

const RESULTADOS_VALIDOS = ['aprobada', 'rechazada', 'pendiente'] as const;

export async function adminRevisarFoto(
    fotoId: number,
    resultado: (typeof RESULTADOS_VALIDOS)[number],
    motivo?: string
) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    if (!Number.isInteger(fotoId) || fotoId <= 0) {
        return { success: false, error: 'Registro de foto no válido' };
    }

    if (!RESULTADOS_VALIDOS.includes(resultado)) {
        return { success: false, error: 'Resultado no válido' };
    }

    const supabase = await createClient();
    const { data: foto, error: fotoError } = await supabase
        .from('fotos_validacion')
        .select('id, propiedad_id, foto_url, motivo, resultado')
        .eq('id', fotoId)
        .maybeSingle();

    if (fotoError || !foto) {
        return { success: false, error: 'El registro de foto no existe' };
    }

    const motivoFinal = motivo?.trim() || foto.motivo;
    const { error } = await supabase
        .from('fotos_validacion')
        .update({
            resultado,
            revisado_por: auth.user.id,
            motivo: motivoFinal,
        })
        .eq('id', fotoId);

    if (error) {
        console.error('Error revisando foto:', error);
        return { success: false, error: 'No se pudo actualizar la validación de la foto' };
    }

    await logAdminAction('revisar_foto', 'fotos_validacion', String(fotoId), {
        resultado,
        motivo: motivoFinal,
        propiedad_id: foto.propiedad_id,
    });

    revalidatePath('/admin/fotos');
    if (foto.propiedad_id) revalidatePath(`/propiedades/${foto.propiedad_id}`);
    return { success: true };
}
