import type { SupabaseClient } from '@supabase/supabase-js';
import type { SuspensionActiva } from './types';

type SuspensionRow = {
    id: number;
    nivel: number;
    motivo: string | null;
    fecha_fin: string | null;
    fecha_inicio: string;
};

function normalizarSuspension(data: unknown): SuspensionActiva | null {
    if (!data) return null;

    const row = (Array.isArray(data) ? data[0] : data) as SuspensionRow | undefined;
    if (!row?.id) return null;

    return {
        id: row.id,
        nivel: Number(row.nivel) as SuspensionActiva['nivel'],
        motivo: row.motivo,
        fecha_fin: row.fecha_fin,
        fecha_inicio: row.fecha_inicio,
    };
}

async function obtenerViaRpc(
    supabase: SupabaseClient,
    userId: string
): Promise<SuspensionActiva | null> {
    const { data, error } = await supabase.rpc('get_suspension_activa', {
        check_user_id: userId,
    });

    if (error) {
        // RPC no existe aún (migración 004 pendiente) — fallback abajo
        if (error.code !== 'PGRST202' && !error.message?.includes('Could not find')) {
            console.error('[suspensiones] RPC get_suspension_activa error:', error.message);
        }
        return null;
    }

    return normalizarSuspension(data);
}

async function obtenerViaTabla(
    supabase: SupabaseClient,
    userId: string
): Promise<SuspensionActiva | null> {
    const { data, error } = await supabase
        .from('suspensiones')
        .select('id, nivel, motivo, fecha_fin, fecha_inicio')
        .eq('usuario_id', userId)
        .eq('activa', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('[suspensiones] SELECT suspensiones error:', error.message, error.code);
        return null;
    }

    if (!data) return null;

    if (Number(data.nivel) === 3) {
        return data as SuspensionActiva;
    }

    if (data.fecha_fin && new Date(data.fecha_fin) <= new Date()) {
        await supabase.from('suspensiones').update({ activa: false }).eq('id', data.id);
        return null;
    }

    return data as SuspensionActiva;
}

export async function obtenerSuspensionActiva(
    supabase: SupabaseClient,
    userId: string
): Promise<SuspensionActiva | null> {
    const viaRpc = await obtenerViaRpc(supabase, userId);
    if (viaRpc) return viaRpc;

    return obtenerViaTabla(supabase, userId);
}

export function esSuspensionVigente(s: SuspensionActiva): boolean {
    if (Number(s.nivel) === 3) return true;
    if (!s.fecha_fin) return true;
    return new Date(s.fecha_fin) > new Date();
}
