'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { assertPuedeGestionarPropiedades } from '@/app/acciones/suspensionesActions';

export async function cambiarEstadoPropiedad(propiedadId: number, nuevoEstado: string) {
    const activo = await assertPuedeGestionarPropiedades();
    if (!activo.ok) {
        return { error: activo.error };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // Actualizar estado asegurando que el usuario es el dueño
    const { error } = await supabase
        .from('propiedades')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', propiedadId)
        .eq('propietario_id', user.id);

    if (error) {
        console.error('Error al cambiar estado:', error);
        return { error: 'Error al cambiar el estado de la propiedad.' };
    }

    revalidatePath('/dashboard/propiedades');
    revalidatePath(`/propiedades/${propiedadId}`);
    revalidatePath('/');
    revalidatePath('/explorar');
    
    return { success: true };
}

export async function eliminarPropiedad(propiedadId: number, password?: string) {
    const activo = await assertPuedeGestionarPropiedades();
    if (!activo.ok) {
        return { error: activo.error };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // Si se proporciona contraseña, verificarla re-autenticando
    if (password) {
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: password,
        });

        if (authError) {
            return { error: 'Contraseña incorrecta. No se pudo eliminar la propiedad.' };
        }
    } else {
        return { error: 'Se requiere la contraseña para confirmar la eliminación.' };
    }

    // Proceder con el borrado
    const { error } = await supabase
        .from('propiedades')
        .delete()
        .eq('id', propiedadId)
        .eq('propietario_id', user.id);

    if (error) {
        console.error('Error al eliminar propiedad:', error);
        return { error: 'Error al eliminar la propiedad de la base de datos.' };
    }

    revalidatePath('/dashboard/propiedades');
    revalidatePath('/');
    revalidatePath('/explorar');

    return { success: true };
}
