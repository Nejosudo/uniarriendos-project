import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getAdminSession() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, avatar_url, rol')
        .eq('id', user.id)
        .single();

    if (!perfil || perfil.rol !== 'admin') return null;

    return { user, perfil };
}

export async function requireAdmin() {
    const session = await getAdminSession();
    if (!session) redirect('/');
    return session;
}

export async function verifyAdminAction() {
    const session = await getAdminSession();
    if (!session) {
        return { success: false as const, error: 'No autorizado' };
    }
    return { success: true as const, user: session.user, perfil: session.perfil };
}
