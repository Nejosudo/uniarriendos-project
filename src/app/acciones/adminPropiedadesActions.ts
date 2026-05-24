'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAction } from '@/lib/admin/auth';

export async function adminCambiarEstadoPropiedad(propiedadId: number, nuevoEstado: string) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    const estadosValidos = ['disponible', 'ocupado', 'inactivo'];
    if (!estadosValidos.includes(nuevoEstado)) {
        return { success: false, error: 'Estado no válido' };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from('propiedades')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', propiedadId);

    if (error) {
        console.error('Error admin cambiando estado:', error);
        return { success: false, error: 'No se pudo cambiar el estado' };
    }

    revalidatePath('/admin/propiedades');
    revalidatePath(`/propiedades/${propiedadId}`);
    revalidatePath('/explorar');
    revalidatePath('/');
    return { success: true };
}

export async function adminCambiarPrioridad(propiedadId: number, prioridad: string) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    const prioridadesValidas = ['comun', 'recomendada'];
    if (!prioridadesValidas.includes(prioridad)) {
        return { success: false, error: 'Prioridad no válida' };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from('propiedades')
        .update({ prioridad, updated_at: new Date().toISOString() })
        .eq('id', propiedadId);

    if (error) {
        console.error('Error admin cambiando prioridad:', error);
        return { success: false, error: 'No se pudo cambiar la prioridad' };
    }

    revalidatePath('/admin/propiedades');
    revalidatePath('/explorar');
    revalidatePath('/');
    return { success: true };
}

export async function adminToggleVerificada(propiedadId: number, verificada: boolean) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    const supabase = await createClient();
    const { error } = await supabase
        .from('propiedades')
        .update({ verificada, updated_at: new Date().toISOString() })
        .eq('id', propiedadId);

    if (error) {
        console.error('Error admin verificando propiedad:', error);
        return { success: false, error: 'No se pudo actualizar la verificación' };
    }

    revalidatePath('/admin/propiedades');
    revalidatePath(`/propiedades/${propiedadId}`);
    return { success: true };
}
