'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
    sanitizeText,
    validateNombre,
    validateTelefonoCO,
    normalizeTelefonoCO,
    isAllowedImageUrl
} from '@/lib/validation';

export async function actualizarPerfil(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const nombre_completo = sanitizeText(String(formData.get('nombre_completo') || ''), 60);
    const errorNombre = validateNombre(nombre_completo);
    if (errorNombre) return { error: errorNombre };

    const telefonoIngresado = String(formData.get('telefono') || '').trim();
    const errorTelefono = validateTelefonoCO(telefonoIngresado);
    if (errorTelefono) return { error: errorTelefono };
    const telefono = normalizeTelefonoCO(telefonoIngresado);

    const avatarIngresado = String(formData.get('avatar_url') || '').trim();
    if (avatarIngresado && !isAllowedImageUrl(avatarIngresado)) {
        return { error: 'La URL del avatar no es válida' };
    }
    const avatar_url = avatarIngresado || null;

    // Ruta principal: RPC SECURITY DEFINER (no depende de grants por columna
    // ni del trigger anti-escalada). Si aún no se aplicó la migración 020,
    // se usa el update directo como respaldo.
    const { error: rpcError } = await supabase.rpc('actualizar_mi_perfil', {
        p_nombre_completo: nombre_completo,
        p_telefono: telefono,
        p_avatar_url: avatar_url,
    });

    let error = rpcError;
    const rpcNoDisponible =
        rpcError?.code === 'PGRST202' ||
        /could not find the function|does not exist/i.test(rpcError?.message || '');

    if (rpcNoDisponible) {
        const { error: directError } = await supabase
            .from('perfiles')
            .update({
                nombre_completo,
                telefono,
                avatar_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        error = directError;
    }

    if (error) {
        console.error('Error actualizando perfil:', error);
        return { error: 'Error al actualizar el perfil' };
    }

    revalidatePath('/dashboard/perfil');
    return { success: true };
}
