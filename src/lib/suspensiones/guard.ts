import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { obtenerSuspensionActiva } from './check';
import { esRutaDashboardPermitida, getRestricciones, type RestriccionesSuspension } from './permissions';
import type { SuspensionActiva } from './types';

export type { RestriccionesSuspension };

export async function getSuspensionForLayout(): Promise<SuspensionActiva | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let suspension = await obtenerSuspensionActiva(supabase, user.id);

    if (!suspension) {
        const { data: activo } = await supabase.rpc('is_user_active', {
            check_user_id: user.id,
        });
        if (activo === false) {
            suspension = {
                id: -1,
                nivel: 1,
                motivo: null,
                fecha_fin: null,
                fecha_inicio: new Date().toISOString(),
            };
        }
    }

    return suspension;
}

export async function getRestriccionesUsuario(): Promise<RestriccionesSuspension> {
    const suspension = await getSuspensionForLayout();
    return getRestricciones(suspension);
}

export async function redirectSiNoPuedeGestionarPropiedades(): Promise<void> {
    const restricciones = await getRestriccionesUsuario();
    if (!restricciones.puedeGestionarPropiedades) {
        redirect(restricciones.nivel && restricciones.nivel >= 3 ? '/dashboard/perfil' : '/dashboard/propiedades');
    }
}

/** @deprecated Usar redirectSiNoPuedeGestionarPropiedades */
export async function redirectSiSuspendido(): Promise<void> {
    return redirectSiNoPuedeGestionarPropiedades();
}

export async function redirectSiNoPuedeUsarFavoritos(): Promise<void> {
    const restricciones = await getRestriccionesUsuario();
    if (!restricciones.puedeUsarFavoritos) {
        redirect('/dashboard/perfil');
    }
}

export async function assertRutaDashboardPermitida(pathname: string): Promise<void> {
    const restricciones = await getRestriccionesUsuario();
    if (!esRutaDashboardPermitida(pathname, restricciones)) {
        redirect('/dashboard/perfil');
    }
}
