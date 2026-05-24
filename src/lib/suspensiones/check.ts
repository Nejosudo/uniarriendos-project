import type { SupabaseClient } from '@supabase/supabase-js';
import type { SuspensionActiva } from './types';

export async function obtenerSuspensionActiva(
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

    if (error || !data) return null;

    if (Number(data.nivel) === 3) return data as SuspensionActiva;

    if (data.fecha_fin && new Date(data.fecha_fin) <= new Date()) {
        await supabase.from('suspensiones').update({ activa: false }).eq('id', data.id);
        return null;
    }

    return data as SuspensionActiva;
}

export function esSuspensionVigente(s: SuspensionActiva): boolean {
    if (Number(s.nivel) === 3) return true;
    if (!s.fecha_fin) return true;
    return new Date(s.fecha_fin) > new Date();
}
