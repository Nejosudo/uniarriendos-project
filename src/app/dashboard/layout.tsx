import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import styles from './dashboard.module.css';
import DashboardSidebar from '@/componentes/dashboard/DashboardSidebar/DashboardSidebar';
import DashboardSuspensionGuard from '@/componentes/dashboard/DashboardSuspensionGuard/DashboardSuspensionGuard';
import { getSuspensionForLayout } from '@/lib/suspensiones/guard';
import PhoneBanner from '@/componentes/dashboard/PhoneBanner/PhoneBanner';

export const metadata: Metadata = {
    title: 'Dashboard - Mi cuenta | UniArriendos',
    description: 'Gestiona tu cuenta, propiedades, favoritos y mensajes en UniArriendos.',
    robots: 'noindex, nofollow',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login');
    }

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const suspension = await getSuspensionForLayout();

    return (
        <div className={styles.dashboardContainer}>
            {suspension && Number(suspension.nivel) >= 3 && (
                <DashboardSuspensionGuard suspension={suspension} />
            )}
            <div className={styles.sidebarWrapper}>
                <DashboardSidebar
                    perfil={perfil}
                    email={user.email || ''}
                    suspension={suspension}
                />
            </div>
            <main className={styles.mainContent}>
                <PhoneBanner />
                {children}
            </main>
        </div>
    );
}
