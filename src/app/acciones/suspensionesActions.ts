'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAction } from '@/lib/admin/auth';
import { obtenerSuspensionActiva } from '@/lib/suspensiones/check';
import {calcularFechaFinSuspension,getMensajeSuspension} from '@/lib/suspensiones/types';
import type { NivelSuspension, SuspensionActiva } from '@/lib/suspensiones/types';

export async function obtenerMiSuspension(): Promise<SuspensionActiva | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return obtenerSuspensionActiva(supabase, user.id);
}

export async function assertUsuarioActivo(): Promise<
    | { ok: true; userId: string }
    | { ok: false; error: string }
> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { ok: false, error: 'Usuario no autorizado' };
    }

    const suspension = await obtenerSuspensionActiva(supabase, user.id);
    if (suspension) {
        const extra = suspension.motivo ? ` Motivo: ${suspension.motivo}` : '';
        return { ok: false, error: getMensajeSuspension(suspension) + extra };
    }

    return { ok: true, userId: user.id };
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
        .update({ activa: true })
        .eq('usuario_id', usuarioId)
        .eq('activa', false);

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

    revalidatePath('/admin/usuarios');
    revalidatePath('/dashboard');
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

    revalidatePath('/admin/usuarios');
    revalidatePath('/dashboard');
    return { success: true };
}
