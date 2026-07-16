import type { Metadata } from 'next';
import AdminSidebar from '@/componentes/admin/AdminSidebar/AdminSidebar';
import { requireAdmin } from '@/lib/admin/auth';
import styles from './admin.module.css';

export const metadata: Metadata = {
    title: 'Panel de Administración | UniArriendos',
    description: 'Panel administrativo para gestionar usuarios, propiedades y PQRS en UniArriendos.',
    robots: 'noindex, nofollow',
};

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
