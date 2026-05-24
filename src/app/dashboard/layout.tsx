import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import styles from './dashboard.module.css';
import DashboardSidebar from '@/componentes/dashboard/DashboardSidebar/DashboardSidebar';
import SuspensionBanner from '@/componentes/dashboard/SuspensionBanner/SuspensionBanner';
import { getSuspensionForLayout } from '@/lib/suspensiones/guard';

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
            <div className={styles.sidebarWrapper}>
                <DashboardSidebar
                    perfil={perfil}
                    email={user.email || ''}
                    usuarioSuspendido={!!suspension}
                />
            </div>
            <main className={styles.mainContent}>
                {suspension && <SuspensionBanner suspension={suspension} />}
                {children}
            </main>
        </div>
    );
}
