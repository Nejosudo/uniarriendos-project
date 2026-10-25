import type { Metadata } from 'next';
import Link from 'next/link';
import AdminSidebar from '@/componentes/admin/AdminSidebar/AdminSidebar';
import NotificationBell from '@/componentes/ui/NotificationBell/NotificationBell';
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
            <div className={styles.contentWrapper}>
                <header className={styles.topbar}>
                    <Link href="/admin" className={styles.topbarBrand}>
                        Administración
                    </Link>
                    <NotificationBell notificacionesHref="/admin/notificaciones" />
                </header>
                <main className={styles.mainContent}>{children}</main>
            </div>
        </div>
    );
}
