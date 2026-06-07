'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAction } from '@/lib/admin/auth';
import { obtenerSuspensionActiva } from '@/lib/suspensiones/check';
import { getRestricciones } from '@/lib/suspensiones/permissions';
import { calcularFechaFinSuspension, getMensajeSuspension } from '@/lib/suspensiones/types';
import type { NivelSuspension, SuspensionActiva } from '@/lib/suspensiones/types';
import { crearNotificacion } from './notificacionesActions';

export async function obtenerMiSuspension(): Promise<SuspensionActiva | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return obtenerSuspensionActiva(supabase, user.id);
}

async function getSuspensionYRestricciones() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, suspension: null, restricciones: getRestricciones(null) };

    let suspension = await obtenerSuspensionActiva(supabase, user.id);

    // Fallback: is_user_active en BD (funciona aunque SELECT a suspensiones falle)
    if (!suspension) {
        const { data: activo, error: rpcError } = await supabase.rpc('is_user_active', {
            check_user_id: user.id,
        });
        if (!rpcError && activo === false) {
            suspension = {
                id: -1,
                nivel: 1,
                motivo: null,
                fecha_fin: null,
                fecha_inicio: new Date().toISOString(),
            };
        }
    }

    return { user, suspension, restricciones: getRestricciones(suspension) };
}

export async function assertPuedeGestionarPropiedades(): Promise<
    | { ok: true; userId: string }
    | { ok: false; error: string }
> {
    const { user, suspension, restricciones } = await getSuspensionYRestricciones();

    if (!user) {
        return { ok: false, error: 'Usuario no autorizado' };
    }

    if (!restricciones.puedeGestionarPropiedades && suspension) {
        const extra = suspension.motivo ? ` Motivo: ${suspension.motivo}` : '';
        return { ok: false, error: getMensajeSuspension(suspension) + extra };
    }

    return { ok: true, userId: user.id };
}

/** @deprecated Usar assertPuedeGestionarPropiedades */
export async function assertUsuarioActivo(): Promise<
    | { ok: true; userId: string }
    | { ok: false; error: string }
> {
    return assertPuedeGestionarPropiedades();
}

export async function assertPuedeUsarFavoritos(): Promise<
    | { ok: true; userId: string }
    | { ok: false; error: string }
> {
    const { user, suspension, restricciones } = await getSuspensionYRestricciones();

    if (!user) {
        return { ok: false, error: 'Debes iniciar sesión para guardar favoritos.' };
    }

    if (!restricciones.puedeUsarFavoritos && suspension) {
        return { ok: false, error: 'Tu cuenta está suspendida (nivel 2 o superior) y no puedes usar favoritos.' };
    }

    // Verificación adicional vía RPC en BD (defensa en profundidad)
    const supabase = await createClient();
    const { data: puede, error } = await supabase.rpc('puede_usar_favoritos', {
        check_user_id: user.id,
    });

    if (!error && puede === false) {
        return { ok: false, error: 'Tu cuenta está suspendida (nivel 2 o superior) y no puedes usar favoritos.' };
    }

    return { ok: true, userId: user.id };
}

export async function assertPuedeInteractuarPublicaciones(): Promise<
    | { ok: true; userId: string }
    | { ok: false; error: string }
> {
    const { user, suspension, restricciones } = await getSuspensionYRestricciones();

    if (!user) {
        return { ok: false, error: 'Debes iniciar sesión para interactuar con publicaciones.' };
    }

    if (!restricciones.puedeInteractuarPublicaciones && suspension) {
        return { ok: false, error: 'Tu cuenta está suspendida y no puedes dejar reseñas ni preguntas.' };
    }

    return { ok: true, userId: user.id };
}

async function ocultarPropiedadesUsuario(supabase: Awaited<ReturnType<typeof createClient>>, usuarioId: string) {
    const { error } = await supabase
        .from('propiedades')
        .update({ estado: 'inactivo', updated_at: new Date().toISOString() })
        .eq('propietario_id', usuarioId)
        .neq('estado', 'inactivo');

    if (error) {
        console.error('Error ocultando propiedades del usuario suspendido:', error);
    }
}

export async function suspenderUsuario(
    usuarioId: string,
    nivel: NivelSuspension | string | number,
    motivo?: string
) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    if (usuarioId === auth.user.id) {
        return { success: false, error: 'No puedes suspenderte a ti mismo' };
    }

    const nivelNum = Number(nivel) as NivelSuspension;
    if (![1, 2, 3].includes(nivelNum)) {
        return { success: false, error: `Nivel de suspensión no válido: ${nivel}` };
    }

    const supabase = await createClient();

    const { error: updateError } = await supabase
        .from('suspensiones')
        .update({ activa: false })
        .eq('usuario_id', usuarioId)
        .eq('activa', true);

    if (updateError) {
        console.error('Error desactivando suspensiones anteriores:', updateError);
        return { success: false, error: `Error desactivando suspensiones anteriores: ${updateError.message}` };
    }

    const { error } = await supabase.from('suspensiones').insert({
        usuario_id: usuarioId,
        admin_id: auth.user.id,
        nivel: nivelNum,
        motivo: motivo?.trim() || null,
        fecha_fin: calcularFechaFinSuspension(nivelNum),
        activa: true,
    });

    if (error) {
        console.error('Error suspendiendo usuario:', error);
        return { success: false, error: `No se pudo aplicar la suspensión: ${error.message}` };
    }

    await ocultarPropiedadesUsuario(supabase, usuarioId);

    await crearNotificacion({
        usuarioId: usuarioId,
        tipo: 'suspension_aplicada',
        titulo: 'Cuenta Suspendida',
        mensaje: `Tu cuenta fue suspendida (nivel ${nivelNum}). ${motivo ? `Motivo: ${motivo}` : ''}`,
        enlace: '/dashboard',
        metadata: { nivel: nivelNum }
    });

    revalidatePath('/admin/usuarios');
    revalidatePath('/dashboard');
    revalidatePath('/explorar');
    revalidatePath('/');
    return { success: true };
}

export async function levantarSuspension(usuarioId: string) {
    const auth = await verifyAdminAction();
    if (!auth.success) return auth;

    const supabase = await createClient();
    const { error } = await supabase
        .from('suspensiones')
        .update({ activa: false })
        .eq('usuario_id', usuarioId)
        .eq('activa', true);

    if (error) {
        console.error('Error levantando suspensión:', error);
        return { success: false, error: `No se pudo levantar la suspensión: ${error.message}` };
    }

    await crearNotificacion({
        usuarioId: usuarioId,
        tipo: 'suspension_levantada',
        titulo: 'Suspensión Levantada',
        mensaje: 'Tu suspensión fue levantada. Ya puedes usar la plataforma con normalidad.',
        enlace: '/dashboard'
    });

    revalidatePath('/admin/usuarios');
    revalidatePath('/dashboard');
    revalidatePath('/explorar');
    revalidatePath('/');
    return { success: true };
}
