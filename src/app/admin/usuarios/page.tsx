import { createClient } from '@/lib/supabase/server';
import AdminUsuariosTable from '@/componentes/admin/AdminUsuariosTable/AdminUsuariosTable';
import styles from './page.module.css';

export default async function AdminUsuariosPage() {
    const supabase = await createClient();

    const { data: usuarios, error } = await supabase
        .from('perfiles')
        .select(`
            id,
            nombre_completo,
            telefono,
            fecha_nacimiento,
            avatar_url,
            rol,
            tipo,
            estado,
            created_at,
            suspensiones!suspensiones_usuario_id_fkey (
                id,
                nivel,
                motivo,
                fecha_fin,
                activa
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error cargando usuarios admin:', error);
    }

    const usuariosConSuspensionActiva = (usuarios || []).map((u) => ({
        ...u,
        suspensiones: u.suspensiones?.filter((s: { activa: boolean }) => s.activa) || [],
    }));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Gestión de Usuarios</h1>
                <p className={styles.subtitle}>
                    Administra roles y suspensiones de los usuarios de la plataforma.
                </p>
            </header>
            <AdminUsuariosTable usuarios={usuariosConSuspensionActiva} />
        </div>
    );
}
