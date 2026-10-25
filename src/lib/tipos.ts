export type ServicioBasico = {
    nombre: string;
    icono: string;
};

export type AnfitrionBasico = {
    nombre_completo: string;
    avatar_url: string | null;
    tipo?: string | null;
};

export type PerfilBasico = {
    avatar_url: string | null;
    nombre_completo: string | null;
    telefono?: string | null;
    tipo?: string | null;
    rol?: string | null;
    email?: string | null;
};

export type PropiedadLista = {
    id: number;
    titulo: string;
    precio: number;
    ubicacion_texto: string;
    ubicacion_lat: number | null;
    ubicacion_lng: number | null;
    vivienda_compartida: boolean | null;
    estado: string | null;
    prioridad: string | null;
    verificada: boolean | null;
    perfil_arriendo: string | null;
    descripcion: string | null;
    created_at: string | null;
    updated_at: string | null;
    normas_convivencia_url: string | null;
    anfitrion: AnfitrionBasico | null;
    propiedades_fotos: { url: string; orden?: number | null }[] | null;
    servicios_rel: { servicio: ServicioBasico | null }[] | null;
    propiedades_servicios: { servicio_id: number }[] | null;
    resenas: { calificacion: number; reportada?: boolean; created_at: string; [key: string]: unknown }[] | null;
    preguntas: { created_at: string; [key: string]: unknown }[] | null;
    _score?: number;
};

export type PqrsRespuesta = {
    id: number;
    pqrs_id: number;
    mensaje: string;
    imagen_url: string | null;
    created_at: string;
    admin_id: string | null;
    usuario_id: string | null;
}
