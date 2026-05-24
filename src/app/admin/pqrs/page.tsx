import { createClient } from '@/lib/supabase/server';
import AdminPqrsPanel from '@/componentes/admin/AdminPqrsPanel/AdminPqrsPanel';
import styles from '../usuarios/page.module.css';

export default async function AdminPqrsPage() {
    const supabase = await createClient();

    const { data: pqrs, error } = await supabase
        .from('pqrs')
        .select(`
            id,
            tipo,
            asunto,
            mensaje,
            estado,
            created_at,
            usuario:perfiles!usuario_id (nombre_completo),
            pqrs_respuestas (
                id,
                mensaje,
                created_at
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error cargando PQRS admin:', error);
    }

    const pqrsNormalizadas = (pqrs || []).map((item) => ({
        ...item,
        usuario: Array.isArray(item.usuario) ? item.usuario[0] : item.usuario,
    }));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Buzón PQRS</h1>
                <p className={styles.subtitle}>
                    Responde peticiones, quejas, reclamos y sugerencias de los usuarios.
                </p>
            </header>
            <AdminPqrsPanel pqrs={pqrsNormalizadas} />
        </div>
    );
}
