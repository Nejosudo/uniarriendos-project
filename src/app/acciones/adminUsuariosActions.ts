'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAction } from '@/lib/admin/auth';
import type { RolUsuario } from '@/lib/suspensiones/types';
import { logAdminAction } from './adminAuditActions';

export async function cambiarRolUsuario(usuarioId: string, nuevoRol: RolUsuario) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    if (!['usuario', 'admin'].includes(nuevoRol)) {
        return { success: false, error: 'Rol no válido' };
    }

    if (usuarioId === auth.user.id && nuevoRol !== 'admin') {
        return { success: false, error: 'No puedes quitarte el rol de administrador a ti mismo' };
    }

    const supabase = await createClient();

    if (nuevoRol === 'usuario') {
        const { data: objetivo, error: objetivoError } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', usuarioId)
            .single();

        if (objetivoError || !objetivo) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        if (objetivo.rol === 'admin') {
            const { count, error: countError } = await supabase
                .from('perfiles')
                .select('id', { count: 'exact', head: true })
                .eq('rol', 'admin');

            if (countError) {
                return { success: false, error: 'No se pudo verificar la cantidad de administradores' };
            }

            if ((count ?? 0) <= 1) {
                return { success: false, error: 'No puedes quitar el rol al último administrador' };
            }
        }
    }

    const { error } = await supabase
        .from('perfiles')
        .update({ rol: nuevoRol })
        .eq('id', usuarioId);

    if (error) {
        console.error('Error cambiando rol:', error);
        return { success: false, error: 'No se pudo actualizar el rol' };
    }

    await logAdminAction('cambiar_rol_usuario', 'perfiles', usuarioId, { nuevoRol });

    revalidatePath('/admin/usuarios');
    return { success: true };
}
