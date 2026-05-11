'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function cambiarEstadoPropiedad(propiedadId: number, nuevoEstado: string) {
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

export async function eliminarPropiedad(propiedadId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // La política RLS debería proteger, pero agregamos el check extra aquí
    const { error } = await supabase
        .from('propiedades')
        .delete()
        .eq('id', propiedadId)
        .eq('propietario_id', user.id);

    if (error) {
        console.error('Error al eliminar propiedad:', error);
        return { error: 'Error al eliminar la propiedad.' };
    }

    revalidatePath('/dashboard/propiedades');
    revalidatePath('/');
    revalidatePath('/explorar');

    return { success: true };
}
