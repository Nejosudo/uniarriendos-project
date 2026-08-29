'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { assertPuedeInteractuarPublicaciones } from '@/app/acciones/suspensionesActions';
import { crearNotificacion } from './notificacionesActions';
import { sanitizeText, validateTextoLargo } from '@/lib/validation';

export interface PreguntaConUsuario {
    id: number;
    propiedad_id: number;
    pregunta: string;
    respuesta: string | null;
    created_at: string;
    responded_at: string | null;
    usuario?: {
        nombre_completo: string | null;
        avatar_url: string | null;
    } | null;
}

export async function crearPregunta(propiedadId: number, pregunta: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    
    if (!user) {
        return { success: false, error: 'Debes iniciar sesión para enviar una pregunta.' };
    }

    let puedeInteractuar = true;
    try{
        const activo = await assertPuedeInteractuarPublicaciones();
        if (!activo.ok) {
            puedeInteractuar = false;
        }

    } catch(error){
        console.error('Error verificando suspensión:', error);
    }

    if (!puedeInteractuar) {
        return { success: false, error: 'No puedes hacer preguntas debido a una suspensión activa. Contacta al soporte para más información.' };
    }

    const texto = sanitizeText(pregunta || '', 500);
    const eP = validateTextoLargo(texto, 10, 500, 'Pregunta')
    if (eP) return { success: false, error: eP }

    const { data: propiedad, error: propError } = await supabase
        .from('propiedades')
        .select('id, propietario_id')
        .eq('id', propiedadId)
        .single();

    if (propError || !propiedad) {
        return { success: false, error: 'Propiedad no encontrada.' };
    }

    if (propiedad.propietario_id === user.id) {
        return { success: false, error: 'No puedes hacer preguntas en tu propia propiedad.' };
    }

    const { error } = await supabase.from('preguntas').insert({
        propiedad_id: propiedadId,
        usuario_id: user.id,
        pregunta: texto,
    });

    if (error) {
        console.error('Error creando pregunta:', error);
        return { success: false, error: 'No se pudo enviar la pregunta. Intenta de nuevo.' };
    }

    // Notificar al propietario
    const { data: perfilAutor } = await supabase.from('perfiles').select('nombre_completo').eq('id', user.id).single();
    const nombreAutor = perfilAutor?.nombre_completo || 'Un usuario';
    const { data: propData } = await supabase.from('propiedades').select('titulo').eq('id', propiedadId).single();

    await crearNotificacion({
        usuarioId: propiedad.propietario_id,
        tipo: 'pregunta_nueva',
        titulo: 'Nueva Pregunta',
        mensaje: `${nombreAutor} hizo una pregunta en tu propiedad «${propData?.titulo || 'sin título'}».`,
        enlace: `/propiedades/${propiedadId}`,
        metadata: { propiedad_id: propiedadId }
    });

    revalidatePath(`/propiedades/${propiedadId}`);

    return { success: true };
}

export async function responderPregunta(preguntaId: number, respuesta: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Debes iniciar sesión para responder.' };
    }

    const texto2 = sanitizeText(respuesta || '', 1000);
    const eR = validateTextoLargo(texto2, 5, 1000, 'Respuesta')
    if (eR) return { success: false, error: eR }

    const { data: pregunta, error: preguntaError } = await supabase
        .from('preguntas')
        .select('id, propiedad_id, respuesta')
        .eq('id', preguntaId)
        .single();

    if (preguntaError || !pregunta) {
        return { success: false, error: 'Pregunta no encontrada.' };
    }

    if (pregunta.respuesta) {
        return { success: false, error: 'Esta pregunta ya fue respondida.' };
    }

    const { data: propiedad, error: propError } = await supabase
        .from('propiedades')
        .select('id, propietario_id')
        .eq('id', pregunta.propiedad_id)
        .single();

    if (propError || !propiedad) {
        return { success: false, error: 'Propiedad no encontrada.' };
    }

    if (propiedad.propietario_id !== user.id) {
        return { success: false, error: 'Solo el anfitrión puede responder esta pregunta.' };
    }

    const { error } = await supabase
        .from('preguntas')
        .update({
            respuesta: texto2,
            responded_at: new Date().toISOString(),
        })
        .eq('id', preguntaId)
        .is('respuesta', null);

    if (error) {
        console.error('Error respondiendo pregunta:', error);
        return { success: false, error: 'No se pudo publicar la respuesta. Intenta de nuevo.' };
    }

    // Notificar al autor de la pregunta
    const { data: preguntaOriginal } = await supabase.from('preguntas').select('usuario_id').eq('id', preguntaId).single();
    if (preguntaOriginal?.usuario_id) {
        const { data: propData } = await supabase.from('propiedades').select('titulo').eq('id', pregunta.propiedad_id).single();
        await crearNotificacion({
            usuarioId: preguntaOriginal.usuario_id,
            tipo: 'pregunta_respondida',
            titulo: 'Respuesta a tu pregunta',
            mensaje: `El anfitrión respondió tu pregunta en «${propData?.titulo || 'una propiedad'}».`,
            enlace: `/propiedades/${pregunta.propiedad_id}`,
            metadata: { propiedad_id: pregunta.propiedad_id, pregunta_id: preguntaId }
        });
    }

    revalidatePath(`/propiedades/${pregunta.propiedad_id}`);

    return { success: true };
}
