'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { assertPuedeUsarFavoritos } from '@/app/acciones/suspensionesActions';

export async function toggleFavorito(propiedadId: string) {
    const activo = await assertPuedeUsarFavoritos();
    if (!activo.ok) {
        return { error: activo.error };
    }

    const supabase = await createClient();
    const user = { id: activo.userId };

    // Verificar si ya es favorito
    const { data: existente } = await supabase
        .from('favoritos')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('propiedad_id', propiedadId)
        .single();

    if (existente) {
        // Eliminar de favoritos
        const { error } = await supabase
            .from('favoritos')
            .delete()
            .eq('id', existente.id);
            
        if (error) return { error: 'Error al quitar de favoritos' };
        
        revalidatePath('/');
        revalidatePath('/explorar');
        revalidatePath('/dashboard/favoritos');
        revalidatePath(`/propiedades/${propiedadId}`);
        
        return { success: true, isFavorite: false };
    } else {
        // Añadir a favoritos
        const { error } = await supabase
            .from('favoritos')
            .insert({
                usuario_id: user.id,
                propiedad_id: propiedadId
            });
            
        if (error) return { error: 'Error al añadir a favoritos' };
        
        revalidatePath('/');
        revalidatePath('/explorar');
        revalidatePath('/dashboard/favoritos');
        revalidatePath(`/propiedades/${propiedadId}`);
        
        return { success: true, isFavorite: true };
    }
}
