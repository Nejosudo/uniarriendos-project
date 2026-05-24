'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAction } from '@/lib/admin/auth';
import type { RolUsuario } from '@/lib/suspensiones/types';

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
    const { error } = await supabase
        .from('perfiles')
        .update({ rol: nuevoRol })
        .eq('id', usuarioId);

    if (error) {
        console.error('Error cambiando rol:', error);
        return { success: false, error: `No se pudo actualizar el rol: ${error.message}` };
    }

    revalidatePath('/admin/usuarios');
    return { success: true };
}
