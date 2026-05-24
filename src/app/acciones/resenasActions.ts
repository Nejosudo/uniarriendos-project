'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { assertPuedeInteractuarPublicaciones } from '@/app/acciones/suspensionesActions';

export interface ResenaConUsuario {
    id: number;
    propiedad_id: number;
    calificacion: number;
    comentario: string;
    created_at: string;
    reportada?: boolean;
    usuario?: {
        nombre_completo: string | null;
        avatar_url: string | null;
    } | null;
}

export async function crearResena(
    propiedadId: number,
    calificacion: number,
    comentario: string
) {
    const activo = await assertPuedeInteractuarPublicaciones();
    if (!activo.ok) {
        return { success: false, error: activo.error };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Debes iniciar sesión para publicar una reseña.' };
    }

    const cal = Number(calificacion);
    if (!Number.isInteger(cal) || cal < 1 || cal > 5) {
        return { success: false, error: 'La calificación debe ser entre 1 y 5 estrellas.' };
    }

    const texto = comentario?.trim();
    if (!texto || texto.length < 10) {
        return { success: false, error: 'El comentario debe tener al menos 10 caracteres.' };
    }
    if (texto.length > 1000) {
        return { success: false, error: 'El comentario no puede superar 1000 caracteres.' };
    }

    const { data: propiedad, error: propError } = await supabase
        .from('propiedades')
        .select('id, propietario_id')
        .eq('id', propiedadId)
        .single();

    if (propError || !propiedad) {
        return { success: false, error: 'Propiedad no encontrada.' };
    }

    if (propiedad.propietario_id === user.id) {
        return { success: false, error: 'No puedes reseñar tu propia propiedad.' };
    }

    const { data: existente } = await supabase
        .from('resenas')
        .select('id')
        .eq('propiedad_id', propiedadId)
        .eq('usuario_id', user.id)
        .maybeSingle();

    if (existente) {
        return { success: false, error: 'Ya publicaste una reseña para esta propiedad.' };
    }

    const { error } = await supabase.from('resenas').insert({
        propiedad_id: propiedadId,
        usuario_id: user.id,
        calificacion: cal,
        comentario: texto,
        reportada: false,
    });

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: 'Ya publicaste una reseña para esta propiedad.' };
        }
        console.error('Error creando reseña:', error);
        return { success: false, error: 'No se pudo publicar la reseña. Intenta de nuevo.' };
    }

    revalidatePath(`/propiedades/${propiedadId}`);
    revalidatePath('/explorar');
    revalidatePath('/');

    return { success: true };
}

export async function usuarioYaReseno(propiedadId: number): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
        .from('resenas')
        .select('id')
        .eq('propiedad_id', propiedadId)
        .eq('usuario_id', user.id)
        .maybeSingle();

    return !!data;
}
