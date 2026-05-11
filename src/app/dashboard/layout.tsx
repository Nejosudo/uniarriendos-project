import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import styles from './dashboard.module.css';
import DashboardSidebar from '@/componentes/dashboard/DashboardSidebar/DashboardSidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login');
    }

    // Obtener info del perfil
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.sidebarWrapper}>
                <DashboardSidebar perfil={perfil} email={user.email || ''} />
            </div>
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
