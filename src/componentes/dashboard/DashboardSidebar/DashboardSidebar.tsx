'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './DashboardSidebar.module.css';

interface DashboardSidebarProps {
    perfil: any;
    email: string;
}

export default function DashboardSidebar({ perfil, email }: DashboardSidebarProps) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Mi Perfil', path: '/dashboard/perfil', icon: 'User' },
        { name: 'Mis Propiedades', path: '/dashboard/propiedades', icon: 'Home' },
        { name: 'Favoritos', path: '/dashboard/favoritos', icon: 'Heart' },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.profileSummary}>
                <div className={styles.avatarContainer}>
                    {perfil?.avatar_url ? (
                        <img src={perfil.avatar_url} alt="Avatar" className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {perfil?.nombre_completo ? perfil.nombre_completo.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                </div>
                <h3 className={styles.userName}>{perfil?.nombre_completo || 'Usuario'}</h3>
                <p className={styles.userEmail}>{email}</p>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
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
                <Link href="/dashboard/propiedades/crear" className={styles.createBtn}>
                    <DynamicIcon name="PlusCircle" size={20} />
                    Publicar Propiedad
                </Link>
            </div>
        </aside>
    );
}
