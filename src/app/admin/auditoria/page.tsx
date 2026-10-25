import { createClient } from '@/lib/supabase/server';
import AdminAuditoriaTable from '@/componentes/admin/AdminAuditoriaTable/AdminAuditoriaTable';
import styles from '../usuarios/page.module.css';

export default async function AdminAuditoriaPage() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('admin_audit_log')
        .select(`
            id,
            admin_id,
            accion,
            entidad,
            entidad_id,
            detalle,
            created_at,
            admin:perfiles!admin_id(nombre_completo)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

    if (error) {
        console.error('Error cargando auditoría admin:', error);
    }

    const registros = (data || []).map((registro) => ({
        ...registro,
        admin: Array.isArray(registro.admin) ? registro.admin[0] : registro.admin,
    }));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Auditoría de Administradores</h1>
                <p className={styles.subtitle}>
                    Historial de acciones realizadas desde el panel administrativo.
                </p>
            </header>
            <AdminAuditoriaTable registros={registros} />
        </div>
    );
}
