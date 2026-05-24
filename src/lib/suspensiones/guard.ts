import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { obtenerSuspensionActiva } from './check';
import type { SuspensionActiva } from './types';

export async function getSuspensionForLayout(): Promise<SuspensionActiva | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return obtenerSuspensionActiva(supabase, user.id);
}

export async function redirectSiSuspendido(): Promise<void> {
    const suspension = await getSuspensionForLayout();
    if (suspension) {
        redirect('/dashboard/propiedades');
    }
}
