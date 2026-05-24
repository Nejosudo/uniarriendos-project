import type { NivelSuspension, SuspensionActiva } from './types';

export interface RestriccionesSuspension {
    suspendido: boolean;
    nivel: NivelSuspension | null;
    puedeGestionarPropiedades: boolean;
    puedeUsarFavoritos: boolean;
    puedeVerContacto: boolean;
    puedeInteractuarPublicaciones: boolean;
    rutasDashboardPermitidas: string[];
}

const RUTAS_NIVEL_3 = ['/dashboard/perfil', '/dashboard/pqrs'];

export function getRestricciones(suspension: SuspensionActiva | null): RestriccionesSuspension {
    if (!suspension) {
        return {
            suspendido: false,
            nivel: null,
            puedeGestionarPropiedades: true,
            puedeUsarFavoritos: true,
            puedeVerContacto: true,
            puedeInteractuarPublicaciones: true,
            rutasDashboardPermitidas: [],
        };
    }

    const nivel = Number(suspension.nivel) as NivelSuspension;

    return {
        suspendido: true,
        nivel,
        puedeGestionarPropiedades: false,
        puedeUsarFavoritos: nivel < 2,
        puedeVerContacto: nivel < 3,
        puedeInteractuarPublicaciones: false,
        rutasDashboardPermitidas: nivel >= 3 ? RUTAS_NIVEL_3 : [],
    };
}

export function esRutaDashboardPermitida(pathname: string, restricciones: RestriccionesSuspension): boolean {
    if (!restricciones.suspendido || restricciones.rutasDashboardPermitidas.length === 0) {
        return true;
    }

    return restricciones.rutasDashboardPermitidas.some(
        (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
    );
}
