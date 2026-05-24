import { createClient } from '@/lib/supabase/server';
import AdminPropiedadesTable from '@/componentes/admin/AdminPropiedadesTable/AdminPropiedadesTable';
import styles from '../usuarios/page.module.css';

export default async function AdminPropiedadesPage() {
    const supabase = await createClient();

    const { data: propiedades, error } = await supabase
        .from('propiedades')
        .select(`
            *,
            propiedades_fotos (url, orden),
            propietario:perfiles!propiedades_propietario_id_fkey (nombre_completo)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error cargando propiedades admin:', error);
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Gestión de Propiedades</h1>
                <p className={styles.subtitle}>
                    Modera publicaciones: estado, prioridad y verificación.
                </p>
            </header>
            <AdminPropiedadesTable propiedades={propiedades || []} />
        </div>
    );
}
