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

// Simulación de envío de OTP
export async function enviarCodigoSMS(telefono: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // En un proyecto real, usaríamos Twilio o Supabase OTP:
    // await supabase.auth.signInWithOtp({ phone: telefono });
    
    // Como es costoso usar SMS en desarrollo/testing, usaremos un mock:
    console.log(`\n========================================`);
    console.log(`[SIMULADOR SMS UNIARRIENDOS]`);
    console.log(`Enviando código 123456 al número ${telefono}`);
    console.log(`========================================\n`);

    return { success: true, message: 'Se ha enviado un código a tu celular (Usa 123456 para probar).' };
}

// Simulación de verificación de OTP
export async function verificarCodigoSMS(telefono: string, codigo: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    if (codigo === '123456') {
        const { error } = await supabase
            .from('perfiles')
            .update({
                telefono,
                telefono_verificado: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (error) {
            console.error('Error detallado de Supabase:', error);
            return { error: 'Error actualizando el estado de verificación en la base de datos.' };
        }
        
        revalidatePath('/dashboard/perfil');
        revalidatePath('/dashboard/propiedades/crear'); // Importante para permitir publicar
        return { success: true };
    }

    return { error: 'El código ingresado es incorrecto.' };
}
