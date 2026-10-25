import { createClient } from '@/lib/supabase/server';
import AdminResenasTable from '@/componentes/admin/AdminResenasTable/AdminResenasTable';
import styles from '../usuarios/page.module.css';

export default async function AdminResenasPage() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('resenas')
        .select(`
            id,
            propiedad_id,
            calificacion,
            comentario,
            reportada,
            created_at,
            usuario:perfiles(nombre_completo, avatar_url),
            propiedad:propiedades(titulo)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error cargando reseñas admin:', error);
    }

    const resenas = (data || []).map((resena) => ({
        ...resena,
        usuario: Array.isArray(resena.usuario) ? resena.usuario[0] : resena.usuario,
        propiedad: Array.isArray(resena.propiedad) ? resena.propiedad[0] : resena.propiedad,
    }));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Moderación de Reseñas</h1>
                <p className={styles.subtitle}>
                    Revisa las reseñas reportadas, apruébalas o elimínalas.
                </p>
            </header>
            <AdminResenasTable resenas={resenas} />
        </div>
    );
}
