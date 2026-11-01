import { createClient } from '@/lib/supabase/server';

export const CLAVE_PRECIO_VERIFICACION = 'verificacion_precio';
export const PRECIO_VERIFICACION_POR_DEFECTO = 10000;

export const CLAVE_FEEDBACK_ACTIVO = 'feedback_activo';

export function parseFeedbackActivo(valor: string | null | undefined): boolean {
    return valor === 'true' || valor === '1';
}

export async function obtenerPrecioVerificacion(): Promise<number> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('clave', CLAVE_PRECIO_VERIFICACION)
        .maybeSingle();

    const valor = Number(data?.valor);
    return Number.isInteger(valor) && valor > 0 ? valor : PRECIO_VERIFICACION_POR_DEFECTO;
}

export async function obtenerFeedbackActivo(): Promise<boolean> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('clave', CLAVE_FEEDBACK_ACTIVO)
        .maybeSingle();

    return parseFeedbackActivo(data?.valor);
}
