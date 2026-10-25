import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './page.module.css';

const ACCIONES: Record<string, string> = {
    cambiar_rol_usuario: 'Cambió un rol de usuario',
    suspender_usuario: 'Suspendió un usuario',
    levantar_suspension: 'Levantó una suspensión',
    cambiar_estado_propiedad: 'Cambió el estado de una propiedad',
    cambiar_prioridad_propiedad: 'Cambió la prioridad de una propiedad',
    verificar_propiedad: 'Actualizó la verificación de una propiedad',
    responder_pqrs: 'Respondió una PQRS',
    cambiar_estado_pqrs: 'Cambió el estado de una PQRS',
    aprobar_resena: 'Aprobó una reseña',
    ocultar_resena: 'Ocultó una reseña',
    eliminar_resena: 'Eliminó una reseña',
    revisar_foto: 'Revisó una foto',
};

function formatFecha(value: string) {
    return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    const [
        usuarios,
        publicadas,
        ocultas,
        pqrsPendientes,
        pqrsEnProceso,
        resenasReportadas,
        fotosPendientes,
        auditoria,
    ] = await Promise.all([
        supabase.from('perfiles').select('id', { count: 'exact', head: true }),
        supabase.from('propiedades').select('id', { count: 'exact', head: true }).in('estado', ['disponible', 'ocupado']),
        supabase.from('propiedades').select('id', { count: 'exact', head: true }).eq('estado', 'inactivo'),
        supabase.from('pqrs').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('pqrs').select('id', { count: 'exact', head: true }).eq('estado', 'en_proceso'),
        supabase.from('resenas').select('id', { count: 'exact', head: true }).eq('reportada', true),
        supabase
            .from('fotos_validacion')
            .select('id', { count: 'exact', head: true })
            .eq('resultado', 'pendiente')
            .not('foto_url', 'is', null)
            .or('propiedad_id.not.is.null,motivo.like.propiedad:*'),
        supabase
            .from('admin_audit_log')
            .select('id, accion, entidad, entidad_id, detalle, created_at, admin:perfiles!admin_id(nombre_completo)')
            .order('created_at', { ascending: false })
            .limit(6),
    ]);

    const errores = [
        usuarios.error && `usuarios: ${usuarios.error.message}`,
        publicadas.error && `propiedades: ${publicadas.error.message}`,
        ocultas.error && `propiedades ocultas: ${ocultas.error.message}`,
        pqrsPendientes.error && `PQRS pendientes: ${pqrsPendientes.error.message}`,
        pqrsEnProceso.error && `PQRS en proceso: ${pqrsEnProceso.error.message}`,
        resenasReportadas.error && `reseñas: ${resenasReportadas.error.message}`,
        fotosPendientes.error && `fotos: ${fotosPendientes.error.message}`,
        auditoria.error && `auditoría: ${auditoria.error.message}`,
    ].filter(Boolean) as string[];

    const stats = [
        {
            label: 'Usuarios registrados',
            value: usuarios.count ?? 0,
            icon: 'Users',
            href: '/admin/usuarios',
            color: '#3b82f6',
        },
        {
            label: 'Propiedades publicadas',
            value: publicadas.count ?? 0,
            icon: 'Building2',
            href: '/admin/propiedades',
            color: '#1cc65b',
        },
        {
            label: 'Propiedades ocultas',
            value: ocultas.count ?? 0,
            icon: 'Ban',
            href: '/admin/propiedades',
            color: '#64748b',
        },
        {
            label: 'PQRS pendientes',
            value: pqrsPendientes.count ?? 0,
            icon: 'Inbox',
            href: '/admin/pqrs',
            color: '#b45309',
        },
        {
            label: 'PQRS en proceso',
            value: pqrsEnProceso.count ?? 0,
            icon: 'MessageSquare',
            href: '/admin/pqrs',
            color: '#7c3aed',
        },
        {
            label: 'Reseñas reportadas',
            value: resenasReportadas.count ?? 0,
            icon: 'Star',
            href: '/admin/resenas',
            color: '#d97706',
        },
        {
            label: 'Fotos pendientes',
            value: fotosPendientes.count ?? 0,
            icon: 'Image',
            href: '/admin/fotos',
            color: '#0f766e',
        },
    ];

    const actividad = (auditoria.data || []).map((item) => ({
        ...item,
        admin: Array.isArray(item.admin) ? item.admin[0] : item.admin,
    }));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Dashboard Administrativo</h1>
                <p className={styles.subtitle}>Resumen general de la plataforma UniArriendos.</p>
            </header>

            {errores.length > 0 && (
                <div className={styles.errorBanner}>
                    <strong>Algunos datos no se pudieron cargar:</strong>
                    <ul>
                        {errores.map((error) => <li key={error}>{error}</li>)}
                    </ul>
                </div>
            )}

            <div className={styles.statsGrid}>
                {stats.map((stat) => (
                    <Link key={stat.label} href={stat.href} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: `${stat.color}20`, color: stat.color }}>
                            <DynamicIcon name={stat.icon} size={28} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stat.value}</span>
                            <span className={styles.statLabel}>{stat.label}</span>
                        </div>
                    </Link>
                ))}
            </div>

            <div className={styles.bottomGrid}>
                <section className={styles.quickLinks}>
                    <h2>Accesos rápidos</h2>
                    <div className={styles.linksGrid}>
                        <Link href="/admin/usuarios" className={styles.quickLink}>
                            <DynamicIcon name="Users" size={20} />
                            Gestionar usuarios
                        </Link>
                        <Link href="/admin/propiedades" className={styles.quickLink}>
                            <DynamicIcon name="Building2" size={20} />
                            Moderar propiedades
                        </Link>
                        <Link href="/admin/pqrs" className={styles.quickLink}>
                            <DynamicIcon name="MessageSquare" size={20} />
                            Buzón PQRS
                        </Link>
                        <Link href="/admin/resenas" className={styles.quickLink}>
                            <DynamicIcon name="Star" size={20} />
                            Moderar reseñas
                        </Link>
                        <Link href="/admin/fotos" className={styles.quickLink}>
                            <DynamicIcon name="Image" size={20} />
                            Validar fotos
                        </Link>
                        <Link href="/admin/auditoria" className={styles.quickLink}>
                            <DynamicIcon name="ClipboardList" size={20} />
                            Ver auditoría
                        </Link>
                    </div>
                </section>

                <section className={styles.activity}>
                    <div className={styles.activityHeader}>
                        <h2>Actividad reciente</h2>
                        <Link href="/admin/auditoria">Ver todo</Link>
                    </div>

                    {actividad.length === 0 ? (
                        <p className={styles.activityEmpty}>Todavía no hay actividad administrativa registrada.</p>
                    ) : (
                        <ul className={styles.activityList}>
                            {actividad.map((item) => (
                                <li key={item.id}>
                                    <div className={styles.activityText}>
                                        <strong>{item.admin?.nombre_completo || 'Administrador'}</strong>
                                        <span>{ACCIONES[item.accion] || item.accion.replaceAll('_', ' ')}</span>
                                        {item.entidad && (
                                            <small>{item.entidad}{item.entidad_id ? ` #${item.entidad_id}` : ''}</small>
                                        )}
                                    </div>
                                    <time dateTime={item.created_at}>{formatFecha(item.created_at)}</time>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
