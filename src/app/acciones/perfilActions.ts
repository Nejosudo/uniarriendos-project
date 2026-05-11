'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function actualizarPerfil(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const nombre_completo = formData.get('nombre_completo') as string;
    const telefono = formData.get('telefono') as string;
    const avatar_url = formData.get('avatar_url') as string;

    const { error } = await supabase
        .from('perfiles')
        .update({
            nombre_completo,
            telefono,
            avatar_url,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

    if (error) {
        console.error('Error actualizando perfil:', error);
        return { error: 'Error al actualizar el perfil' };
    }

    revalidatePath('/dashboard/perfil');
    return { success: true };
}
