'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function crearPropiedad(formData: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Usuario no autorizado' };
    }

    try {
        // 1. Insertar Propiedad
        const { data: nuevaPropiedad, error: propError } = await supabase
            .from('propiedades')
            .insert({
                propietario_id: user.id,
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                precio: formData.precio,
                ubicacion_texto: formData.ubicacion_texto,
                ubicacion_lat: formData.latitud,
                ubicacion_lng: formData.longitud,
                estado: 'disponible', // Inicia en revisión o disponible según tu flujo
                prioridad: 'comun',
                vivienda_compartida: formData.vivienda_compartida,
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

        return { success: true, propiedadId };
    } catch (error: any) {
        console.error('Excepción en crearPropiedad:', error);
        return { success: false, error: error.message || 'Error inesperado al crear la propiedad' };
    }
}
