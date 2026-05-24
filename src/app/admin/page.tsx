import { createClient } from '@/lib/supabase/server';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './page.module.css';

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    const [
        { count: totalUsuarios },
        { count: totalPropiedades },
        { count: pqrsPendientes },
        { count: pqrsEnProceso },
    ] = await Promise.all([
        supabase.from('perfiles').select('*', { count: 'exact', head: true }),
        supabase.from('propiedades').select('*', { count: 'exact', head: true }),
        supabase.from('pqrs').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('pqrs').select('*', { count: 'exact', head: true }).eq('estado', 'en_proceso'),
    ]);

    const stats = [
        {
            label: 'Usuarios registrados',
            value: totalUsuarios ?? 0,
            icon: 'Users',
            href: '/admin/usuarios',
            color: '#3b82f6',
        },
        {
            label: 'Propiedades publicadas',
            value: totalPropiedades ?? 0,
            icon: 'Building2',
            href: '/admin/propiedades',
            color: '#1cc65b',
        },
        {
            label: 'PQRS pendientes',
            value: pqrsPendientes ?? 0,
            icon: 'Inbox',
            href: '/admin/pqrs',
            color: '#f59e0b',
        },
        {
            label: 'PQRS en proceso',
            value: pqrsEnProceso ?? 0,
            icon: 'MessageSquare',
            href: '/admin/pqrs',
            color: '#8b5cf6',
        },
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Dashboard Administrativo</h1>
                <p className={styles.subtitle}>Resumen general de la plataforma UniArriendos.</p>
            </header>

            <div className={styles.statsGrid}>
                {stats.map((stat) => (
                    <a key={stat.label} href={stat.href} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: `${stat.color}20`, color: stat.color }}>
                            <DynamicIcon name={stat.icon} size={28} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stat.value}</span>
                            <span className={styles.statLabel}>{stat.label}</span>
                        </div>
                    </a>
                ))}
            </div>

            <div className={styles.quickLinks}>
                <h2>Accesos rápidos</h2>
                <div className={styles.linksGrid}>
                    <a href="/admin/usuarios" className={styles.quickLink}>
                        <DynamicIcon name="Users" size={20} />
                        Gestionar usuarios
                    </a>
                    <a href="/admin/propiedades" className={styles.quickLink}>
                        <DynamicIcon name="Building2" size={20} />
                        Moderar propiedades
                    </a>
                    <a href="/admin/pqrs" className={styles.quickLink}>
                        <DynamicIcon name="MessageSquare" size={20} />
                        Buzón PQRS
                    </a>
                </div>
            </div>
        </div>
    );
}
