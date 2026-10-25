import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeText } from '@/lib/validation';

export interface NotificacionPayload {
    usuarioId: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    enlace?: string;
    metadata?: Record<string, unknown> | null;
}

function enlaceSeguro(enlace?: string): string | null {
    if (!enlace) return null;
    if (!enlace.startsWith('/') || enlace.startsWith('//')) return null;
    return enlace.slice(0, 300);
}

export async function crearNotificacion(payload: NotificacionPayload) {
    const supabase = createAdminClient() ?? (await createClient());

    try {
        const { error } = await supabase
            .from('notificaciones')
            .insert({
                usuario_id: payload.usuarioId,
                tipo: sanitizeText(payload.tipo || '', 60),
                titulo: sanitizeText(payload.titulo || '', 120),
                mensaje: sanitizeText(payload.mensaje || '', 500),
                enlace: enlaceSeguro(payload.enlace),
                metadata: payload.metadata ?? null
            });

        if (error) {
            console.error('Error insertando notificacion:', error);
            return { success: false, error: 'No se pudo crear la notificación' };
        }

        return { success: true };
    } catch (error) {
        console.error('Excepción en crearNotificacion:', error);
        return { success: false, error: 'No se pudo crear la notificación' };
    }
}

export async function notificarAdmins(payload: Omit<NotificacionPayload, 'usuarioId'>) {
    const admin = createAdminClient();

    try {
        if (admin) {
            const { data: admins, error: adminsError } = await admin
                .from('perfiles')
                .select('id')
                .eq('rol', 'admin');

            if (adminsError || !admins) {
                return { success: false, error: 'No se pudieron obtener los admins' };
            }

            const inserts = admins.map(adminRow => ({
                usuario_id: adminRow.id,
                tipo: sanitizeText(payload.tipo || '', 60),
                titulo: sanitizeText(payload.titulo || '', 120),
                mensaje: sanitizeText(payload.mensaje || '', 500),
                enlace: enlaceSeguro(payload.enlace),
                metadata: payload.metadata ?? null
            }));

            if (inserts.length === 0) return { success: true };

            const { error } = await admin
                .from('notificaciones')
                .insert(inserts);

            if (error) {
                console.error('Error notificando admins:', error);
                return { success: false, error: 'No se pudo notificar a los administradores' };
            }

            return { success: true };
        }

        const supabase = await createClient();
        const { error } = await supabase.rpc('notificar_admins', {
            p_tipo: sanitizeText(payload.tipo || '', 60),
            p_titulo: sanitizeText(payload.titulo || '', 120),
            p_mensaje: sanitizeText(payload.mensaje || '', 500),
            p_enlace: enlaceSeguro(payload.enlace),
            p_metadata: payload.metadata ?? null,
        });

        if (error) {
            console.error('Error notificando admins vía RPC:', error);
            return {
                success: false,
                error: 'No se pudo notificar a los administradores. Ejecuta la migración 015.',
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Excepción en notificarAdmins:', error);
        return { success: false, error: 'No se pudo notificar a los administradores' };
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
            .limit(50);

        if (error) {
            return { success: false, error: 'No se pudieron cargar las notificaciones' };
        }

        return { success: true, notificaciones: data };
    } catch {
        return { success: false, error: 'No se pudieron cargar las notificaciones' };
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
    } catch {
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

        return { success: true };
    } catch {
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

        return { success: true };
    } catch {
        return { success: false };
    }
}
