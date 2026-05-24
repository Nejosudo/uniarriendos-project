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
    const fin = s.fecha_fin
        ? new Date(s.fecha_fin).toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : null;
    const vigencia = nivelNum === 3
        ? 'de forma permanente'
        : fin
          ? `hasta el ${fin}`
          : `(${duracion})`;

    const restriccionesBase =
        'No puedes crear, editar ni eliminar propiedades, ni dejar reseñas o preguntas. Tus publicaciones están ocultas.';

    if (nivelNum === 1) {
        return `Tu cuenta está suspendida ${vigencia}. ${restriccionesBase}`;
    }
    if (nivelNum === 2) {
        return `Tu cuenta está suspendida ${vigencia}. ${restriccionesBase} Tampoco puedes marcar propiedades como favoritas.`;
    }
    return `Tu cuenta está suspendida ${vigencia}. Solo puedes explorar propiedades, gestionar tu perfil y enviar PQRS para apelar. No verás números de contacto ni podrás interactuar con publicaciones.`;
}

export function getRestriccionesResumidas(nivel: NivelSuspension): string[] {
    const base = [
        'Crear, editar o eliminar propiedades',
        'Dejar reseñas o preguntas en publicaciones',
        'Tus propiedades están ocultas mientras dure la suspensión',
    ];
    if (nivel >= 2) {
        base.push('Marcar propiedades como favoritas');
    }
    if (nivel >= 3) {
        base.push('Ver números de contacto de anfitriones');
        base.push('Acceder a Mis Propiedades y Favoritos en el dashboard');
    }
    return base;
}
