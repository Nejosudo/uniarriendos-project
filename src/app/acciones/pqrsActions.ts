'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type PqrsTipo = 'peticion' | 'queja' | 'reclamo' | 'sugerencia';
export type PqrsEstado = 'pendiente' | 'en_proceso' | 'resuelto';

const TIPOS_VALIDOS: PqrsTipo[] = ['peticion', 'queja', 'reclamo', 'sugerencia'];

interface CrearPqrsInput {
    tipo: PqrsTipo;
    asunto: string;
    mensaje: string;
}

export async function crearPqrs(input: CrearPqrsInput) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Usuario no autorizado' };
    }

    const asunto = input.asunto?.trim();
    const mensaje = input.mensaje?.trim();

    if (!TIPOS_VALIDOS.includes(input.tipo)) {
        return { success: false, error: 'Tipo de PQRS no válido' };
    }

    if (!asunto || asunto.length < 5) {
        return { success: false, error: 'El asunto debe tener al menos 5 caracteres' };
    }

    if (!mensaje || mensaje.length < 20) {
        return { success: false, error: 'El mensaje debe tener al menos 20 caracteres' };
    }

    if (asunto.length > 150) {
        return { success: false, error: 'El asunto no puede superar 150 caracteres' };
    }

    if (mensaje.length > 2000) {
        return { success: false, error: 'El mensaje no puede superar 2000 caracteres' };
    }

    const { data, error } = await supabase
        .from('pqrs')
        .insert({
            usuario_id: user.id,
            tipo: input.tipo,
            asunto,
            mensaje,
            estado: 'pendiente',
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creando PQRS:', error);
        return { success: false, error: 'No se pudo enviar tu solicitud. Intenta de nuevo.' };
    }

    revalidatePath('/dashboard/pqrs');

    return { success: true, pqrsId: data.id };
}

export async function obtenerMisPqrs() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Usuario no autorizado', pqrs: [] };
    }

    const { data, error } = await supabase
        .from('pqrs')
        .select(`
            id,
            tipo,
            asunto,
            mensaje,
            estado,
            created_at,
            updated_at,
            pqrs_respuestas (
                id,
                mensaje,
                created_at
            )
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error obteniendo PQRS:', error);
        return { success: false, error: 'Error al cargar tus solicitudes', pqrs: [] };
    }

    return { success: true, pqrs: data || [] };
}
