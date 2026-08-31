'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { assertPuedeGestionarPropiedades } from '@/app/acciones/suspensionesActions';
import { notificarAdmins } from './notificacionesActions';
import { sanitizeText, validateTextoLargo } from '@/lib/validation';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';

export async function crearPropiedad(formData: any) {
    const activo = await assertPuedeGestionarPropiedades();
    if (!activo.ok) {
        return { success: false, error: activo.error };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Usuario no autorizado' };
    }

    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const rl = checkRateLimit(rateLimitKey(ip, user.id, 'crearPropiedad'), 5, 60 * 60 * 1000);
    if (!rl.ok) return { success: false, error: 'Límite alcanzado: máximo 5 propiedades por hora.' };

    const titulo = sanitizeText(String(formData.titulo || ''), 100);
    const descripcion = sanitizeText(String(formData.descripcion || ''), 2000);
    const ubicacion = sanitizeText(String(formData.ubicacion_texto || ''), 150);
    const et = validateTextoLargo(titulo, 10, 100, 'Título');
    if (et) return { success: false, error: et };
    const ed = validateTextoLargo(descripcion, 20, 2000, 'Descripción');
    if (ed) return { success: false, error: ed };
    const eu = validateTextoLargo(ubicacion, 5, 150, 'Ubicación');
    if (eu) return { success: false, error: eu };
    const precio = Number(formData.precio);
    if (!Number.isFinite(precio) || precio < 10000 || precio > 100000000) return { success: false, error: 'Precio fuera de rango' };
    if (!Array.isArray(formData.fotos) || formData.fotos.length < 1) return { success: false, error: 'Sube al menos 1 foto' };
    if (formData.fotos.length > 10) return { success: false, error: 'Máximo 10 fotos' };

    // Verificar si el usuario tiene un número de contacto válido
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('telefono')
        .eq('id', user.id)
        .single();

    if (!perfil?.telefono || perfil.telefono.trim() === '') {
        return { success: false, error: 'Debes registrar un número de teléfono válido en tu perfil para poder crear una propiedad.' };
    }

    try {
        // 1. Insertar Propiedad
        const { data: nuevaPropiedad, error: propError } = await supabase
            .from('propiedades')
            .insert({
                propietario_id: user.id,
                titulo,
                descripcion,
                precio,
                ubicacion_texto: ubicacion,
                ubicacion_lat: formData.latitud,
                ubicacion_lng: formData.longitud,
                estado: 'disponible',
                prioridad: 'comun',
                vivienda_compartida: !!formData.vivienda_compartida,
                perfil_arriendo: formData.perfil_arriendo
            })
            .select('id')
            .single();

        if (propError || !nuevaPropiedad) {
            console.error('Error insertando propiedad:', propError);
            throw new Error('Error al guardar la información principal.');
        }

        const propiedadId = nuevaPropiedad.id;

        // 2. Insertar Servicios
        if (formData.servicios && formData.servicios.length > 0) {
            const serviciosInsert = formData.servicios.map((servicioId: number) => ({
                propiedad_id: propiedadId,
                servicio_id: servicioId
            }));

            const { error: srvError } = await supabase
                .from('propiedades_servicios')
                .insert(serviciosInsert);

            if (srvError) {
                console.error('Error insertando servicios:', srvError);
                // No lanzamos error fatal aquí para no perder la propiedad creada
            }
        }

        // 3. Insertar Fotos
        if (formData.fotos && formData.fotos.length > 0) {
            const fotosInsert = formData.fotos.map((url: string, index: number) => ({
                propiedad_id: propiedadId,
                url: url,
                orden: index // El índice 0 será la portada
            }));

            const { error: fotosError } = await supabase
                .from('propiedades_fotos')
                .insert(fotosInsert);

            if (fotosError) {
                console.error('Error insertando fotos:', fotosError);
            }
        }

        revalidatePath('/dashboard/propiedades');
        revalidatePath('/explorar');
        revalidatePath('/');


        await notificarAdmins({
            tipo: 'propiedad_nueva_admin',
            titulo: 'Nueva Propiedad',
            mensaje: `Se ha publicado una nueva propiedad: «${titulo}».`,
            enlace: '/admin/propiedades',
            metadata: { propiedad_id: propiedadId }
        });
        
        return { success: true, propiedadId };
    } catch (error: any) {
        console.error('Excepción en crearPropiedad:', error);
        return { success: false, error: error.message || 'Error inesperado al crear la propiedad' };
    }
}

export async function editarPropiedad(propiedadId: number, formData: any) {
    const activo = await assertPuedeGestionarPropiedades();
    if (!activo.ok) {
        return { success: false, error: activo.error };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Usuario no autorizado' };
    }

    try {
        // 1. Validar que la propiedad existe y pertenece al usuario
        const { data: propiedadExistente, error: checkError } = await supabase
            .from('propiedades')
            .select('propietario_id')
            .eq('id', propiedadId)
            .single();

        if (checkError || !propiedadExistente) {
            return { success: false, error: 'Propiedad no encontrada' };
        }

        if (propiedadExistente.propietario_id !== user.id) {
            return { success: false, error: 'No tienes permisos para editar esta propiedad' };
        }

        // 2. Actualizar Propiedad
        const { error: updateError } = await supabase
            .from('propiedades')
            .update({
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                precio: formData.precio,
                ubicacion_texto: formData.ubicacion_texto,
                ubicacion_lat: formData.latitud,
                ubicacion_lng: formData.longitud,
                vivienda_compartida: formData.vivienda_compartida,
                perfil_arriendo: formData.perfil_arriendo,
                updated_at: new Date().toISOString()
            })
            .eq('id', propiedadId);

        if (updateError) {
            console.error('Error actualizando propiedad:', updateError);
            throw new Error('Error al actualizar la información principal.');
        }

        // 3. Actualizar Servicios (eliminar anteriores e insertar nuevos)
        const { error: deleteSrvError } = await supabase
            .from('propiedades_servicios')
            .delete()
            .eq('propiedad_id', propiedadId);

        if (deleteSrvError) {
            console.error('Error eliminando servicios anteriores:', deleteSrvError);
        }

        if (formData.servicios && formData.servicios.length > 0) {
            const serviciosInsert = formData.servicios.map((servicioId: number) => ({
                propiedad_id: propiedadId,
                servicio_id: servicioId
            }));

            const { error: srvError } = await supabase
                .from('propiedades_servicios')
                .insert(serviciosInsert);

            if (srvError) {
                console.error('Error insertando nuevos servicios:', srvError);
            }
        }

        // 4. Actualizar Fotos (eliminar anteriores e insertar las nuevas en el orden especificado)
        const { error: deleteFotosError } = await supabase
            .from('propiedades_fotos')
            .delete()
            .eq('propiedad_id', propiedadId);

        if (deleteFotosError) {
            console.error('Error eliminando fotos anteriores:', deleteFotosError);
        }

        if (formData.fotos && formData.fotos.length > 0) {
            const fotosInsert = formData.fotos.map((url: string, index: number) => ({
                propiedad_id: propiedadId,
                url: url,
                orden: index // El índice 0 será la portada
            }));

            const { error: fotosError } = await supabase
                .from('propiedades_fotos')
                .insert(fotosInsert);

            if (fotosError) {
                console.error('Error insertando fotos nuevas:', fotosError);
            }
        }

        revalidatePath('/dashboard/propiedades');
        revalidatePath(`/propiedades/${propiedadId}`);
        revalidatePath('/explorar');
        revalidatePath('/');

        return { success: true };
    } catch (error: any) {
        console.error('Excepción en editarPropiedad:', error);
        return { success: false, error: error.message || 'Error inesperado al editar la propiedad' };
    }
}

