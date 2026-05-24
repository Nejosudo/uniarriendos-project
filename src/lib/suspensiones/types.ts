export type NivelSuspension = 1 | 2| 3;
export type RolUsuario = 'usuario' | 'admin';

export interface SuspensionActiva {
    id: number;
    nivel: NivelSuspension;
    motivo: string | null;
    fecha_fin: string | null;
    fecha_inicio: string;
}

export const NIVEL_SUSPENSION_LABELS: Record<NivelSuspension, string> = {
    1: '1 mes',
    2: '3 meses',
    3: 'Ban permanente',
};

export function calcularFechaFinSuspension(nivel: NivelSuspension | number | string): string | null {
    const n = Number(nivel);
    const now = new Date();
    if (n === 1) {
        now.setMonth(now.getMonth() + 1);
        return now.toISOString();
    }
    if (n === 2) {
        now.setMonth(now.getMonth() + 3);
        return now.toISOString();
    }
    return null;
}

export function getMensajeSuspension(s: SuspensionActiva): string {
    const nivelNum = Number(s.nivel) as NivelSuspension;
    const duracion = NIVEL_SUSPENSION_LABELS[nivelNum] || `Nivel ${nivelNum}`;
    if (nivelNum === 3) {
        return `Tu cuenta tiene una suspensión permanente (${duracion}). No puedes publicar ni editar propiedades.`;
    }
    const fin = s.fecha_fin
        ? new Date(s.fecha_fin).toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : null;
    return fin
        ? `Tu cuenta está suspendida (${duracion}) hasta el ${fin}. No puedes publicar ni editar propiedades.`
        : `Tu cuenta está suspendida (${duracion}). No puedes publicar ni editar propiedades.`;
}
