'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface NotificacionPayload {
    usuarioId: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    enlace?: string;
    metadata?: any;
}

export async function crearNotificacion(payload: NotificacionPayload) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('notificaciones')
            .insert({
                usuario_id: payload.usuarioId,
                tipo: payload.tipo,
                titulo: payload.titulo,
                mensaje: payload.mensaje,
                enlace: payload.enlace,
                metadata: payload.metadata
            });

        if (error) {
            console.error('Error insertando notificacion:', error);
            return { success: false, error: error.message };
        }

        // Podríamos hacer revalidatePath aquí, pero para no sobrecargar
        // lo dejaremos a demanda o usando polling/SWR en el cliente
        return { success: true };
    } catch (error: any) {
        console.error('Excepción en crearNotificacion:', error);
        return { success: false, error: error.message };
    }
}

export async function notificarAdmins(payload: Omit<NotificacionPayload, 'usuarioId'>) {
    const supabase = await createClient();

    try {
        // Obtener todos los admins
        const { data: admins, error: adminsError } = await supabase
            .from('perfiles')
            .select('id')
            .eq('rol', 'admin');

        if (adminsError || !admins) {
            return { success: false, error: 'No se pudieron obtener los admins' };
        }

        const inserts = admins.map(admin => ({
            usuario_id: admin.id,
            tipo: payload.tipo,
            titulo: payload.titulo,
            mensaje: payload.mensaje,
            enlace: payload.enlace,
            metadata: payload.metadata
        }));

        const { error } = await supabase
            .from('notificaciones')
            .insert(inserts);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function obtenerNotificaciones() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Usuario no autorizado' };
    }

    try {
        const { data, error } = await supabase
            .from('notificaciones')
            .select('*')
            .eq('usuario_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50); // Mostrar las últimas 50

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, notificaciones: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function contarNoLeidas() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, count: 0 };
    }

    try {
        const { count, error } = await supabase
            .from('notificaciones')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', user.id)
            .eq('leida', false);

        if (error) {
            return { success: false, count: 0 };
        }

        return { success: true, count: count || 0 };
    } catch (error: any) {
        return { success: false, count: 0 };
    }
}

export async function marcarLeida(id: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false };

    try {
        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', id)
            .eq('usuario_id', user.id);

        if (error) return { success: false };
        
        revalidatePath('/dashboard/notificaciones');
        return { success: true };
    } catch (error: any) {
        return { success: false };
    }
}

export async function marcarTodasLeidas() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false };

    try {
        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('usuario_id', user.id)
            .eq('leida', false);

        if (error) return { success: false };

        revalidatePath('/dashboard/notificaciones');
        return { success: true };
    } catch (error: any) {
        return { success: false };
    }
}
