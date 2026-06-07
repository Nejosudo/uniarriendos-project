'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { assertPuedeGestionarPropiedades } from '@/app/acciones/suspensionesActions';
import { crearNotificacion } from './notificacionesActions';

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

    // Obtener detalles de la propiedad para la notificación
    const { data: propData } = await supabase.from('propiedades').select('titulo, estado').eq('id', propiedadId).single();
    const titulo = propData?.titulo || 'tu propiedad';

    // Notificar al propietario
    await crearNotificacion({
        usuarioId: user.id,
        tipo: 'propiedad_estado_cambio',
        titulo: 'Estado Actualizado',
        mensaje: `Tu propiedad «${titulo}» ahora está marcada como ${nuevoEstado}.`,
        enlace: `/dashboard/propiedades`,
        metadata: { propiedad_id: propiedadId, estado: nuevoEstado }
    });

    // Si cambió a disponible, notificar a los usuarios que la tienen en favoritos
    if (nuevoEstado === 'disponible') {
        const { data: favoritos } = await supabase
            .from('favoritos')
            .select('usuario_id')
            .eq('propiedad_id', propiedadId);

        if (favoritos && favoritos.length > 0) {
            for (const fav of favoritos) {
                await crearNotificacion({
                    usuarioId: fav.usuario_id,
                    tipo: 'propiedad_disponible',
                    titulo: 'Propiedad Disponible',
                    mensaje: `«${titulo}» volvió a estar disponible.`,
                    enlace: `/propiedades/${propiedadId}`,
                    metadata: { propiedad_id: propiedadId }
                });
            }
        }
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
