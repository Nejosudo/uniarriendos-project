import AdminSidebar from '@/componentes/admin/AdminSidebar/AdminSidebar';
import { requireAdmin } from '@/lib/admin/auth';
import styles from './admin.module.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, perfil } = await requireAdmin();

    return (
        <div className={styles.adminContainer}>
            <div className={styles.sidebarWrapper}>
                <AdminSidebar perfil={perfil} email={user.email || ''} />
            </div>
            <main className={styles.mainContent}>{children}</main>
        </div>
    );
}
