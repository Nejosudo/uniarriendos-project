'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './AdminSidebar.module.css';

interface AdminSidebarProps {
    perfil: { nombre_completo?: string; avatar_url?: string };
    email: string;
}

const navItems = [
    { name: 'Dashboard', path: '/admin', icon: 'LayoutDashboard', exact: true },
    { name: 'Usuarios', path: '/admin/usuarios', icon: 'Users' },
    { name: 'Propiedades', path: '/admin/propiedades', icon: 'Building2' },
    { name: 'PQRS', path: '/admin/pqrs', icon: 'MessageSquare' },
];

export default function AdminSidebar({ perfil, email }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.brand}>
                <DynamicIcon name="Shield" size={22} />
                <span>Panel Admin</span>
            </div>

            <div className={styles.profileSummary}>
                <div className={styles.avatarContainer}>
                    {perfil?.avatar_url ? (
                        <img src={perfil.avatar_url} alt="Avatar" className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {perfil?.nombre_completo?.charAt(0).toUpperCase() || 'A'}
                        </div>
                    )}
                </div>
                <h3 className={styles.userName}>{perfil?.nombre_completo || 'Administrador'}</h3>
                <p className={styles.userEmail}>{email}</p>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.path
                        : pathname === item.path || pathname.startsWith(`${item.path}/`);
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        >
                            <DynamicIcon name={item.icon} size={20} className={styles.navIcon} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <Link href="/" className={styles.backBtn}>
                    <DynamicIcon name="ArrowLeft" size={18} />
                    Volver al sitio
                </Link>
            </div>
        </aside>
    );
}
