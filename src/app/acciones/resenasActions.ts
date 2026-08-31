'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { assertPuedeInteractuarPublicaciones } from '@/app/acciones/suspensionesActions';
import { crearNotificacion } from './notificacionesActions';
import { sanitizeText, validateTextoLargo } from '@/lib/validation';

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

    const texto = sanitizeText(comentario || '', 1000);
    const eT = validateTextoLargo(texto, 10, 1000, 'Comentario')
    if (eT) return { success: false, error: eT }
    const { moderarTexto } = await import('@/lib/moderacion/check');
    const mod = await moderarTexto(texto);
    if (mod.estado === 'oculto') return { success: false, error: 'Contenido no permitido. Revisa el lenguaje.' };

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
        reportada: mod.estado !== 'visible',
    });

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: 'Ya publicaste una reseña para esta propiedad.' };
        }
        console.error('Error creando reseña:', error);
        return { success: false, error: 'No se pudo publicar la reseña. Intenta de nuevo.' };
    }

    const { data: perfilAutor } = await supabase.from('perfiles').select('nombre_completo').eq('id', user.id).single();
    const nombreAutor = perfilAutor?.nombre_completo || 'Un usuario';
    const { data: propData } = await supabase.from('propiedades').select('titulo').eq('id', propiedadId).single();

    await crearNotificacion({
        usuarioId: propiedad.propietario_id,
        tipo: 'resena_nueva',
        titulo: 'Nueva Reseña',
        mensaje: `${nombreAutor} dejó una reseña de ${cal}★ en «${propData?.titulo || 'tu propiedad'}».`,
        enlace: `/propiedades/${propiedadId}`,
        metadata: { propiedad_id: propiedadId }
    });
    try {
      const { data: ownerPerfil } = await supabase.from('perfiles').select('id').eq('id', propiedad.propietario_id).single();
      if (ownerPerfil) {
        const { data: authUser } = await supabase.auth.admin.getUserById(propiedad.propietario_id);
        const email = (authUser as any)?.user?.email || (authUser as any)?.data?.user?.email;
        if (email) {
          const { sendEmail, emailTemplate } = await import('@/lib/email');
          await sendEmail({ to: email, subject: 'Nueva reseña en tu propiedad', html: emailTemplate('Nueva Reseña', `${nombreAutor} dejó una reseña de ${cal}★ en «${propData?.titulo || 'tu propiedad'}».`, `/propiedades/${propiedadId}`) });
        }
      }
    } catch {}

    if (mod.estado === 'pendiente_revision') {
        try { await supabase.from('fotos_validacion').insert({ usuario_id: user.id, resultado: 'pendiente', motivo: `resena_moderacion:${mod.motivo}`, foto_url: null } as any); } catch {}
        try { const { sendEmail, emailTemplate } = await import('@/lib/email'); const { data: auth } = await supabase.auth.getUser(); const email = (auth as any)?.user?.email; if (email) await sendEmail({ to: email, subject: 'Tu reseña está en revisión', html: emailTemplate('Reseña en revisión', 'Tu reseña contiene datos de contacto o fue marcada para revisión manual. Un admin la revisará pronto.', `/propiedades/${propiedadId}`) }); } catch {}
        revalidatePath(`/propiedades/${propiedadId}`);
        return { success: true, pending: true };
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
