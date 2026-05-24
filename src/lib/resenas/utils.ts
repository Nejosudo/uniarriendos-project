export interface ResenaCalificacion {
    calificacion: number;
    reportada?: boolean;
}

export function calcularPromedioResenas(
    resenas: ResenaCalificacion[] | null | undefined
): { promedio: number; total: number } | null {
    if (!resenas?.length) return null;

    const validas = resenas.filter((r) => !r.reportada && r.calificacion >= 1 && r.calificacion <= 5);
    if (validas.length === 0) return null;

    const suma = validas.reduce((acc, r) => acc + r.calificacion, 0);
    const promedio = Math.round((suma / validas.length) * 10) / 10;

    return { promedio, total: validas.length };
}

export function formatearEstrellas(calificacion: number): string {
    const n = Math.max(1, Math.min(5, Math.round(calificacion)));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
}
