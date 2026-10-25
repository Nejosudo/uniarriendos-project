import { createClient } from '@/lib/supabase/server';
import AdminFotosTable from '@/componentes/admin/AdminFotosTable/AdminFotosTable';
import styles from '../usuarios/page.module.css';

export default async function AdminFotosPage() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('fotos_validacion')
        .select(`
            id,
            usuario_id,
            propiedad_id,
            foto_url,
            resultado,
            motivo,
            revisado_por,
            created_at,
            usuario:perfiles!usuario_id(nombre_completo),
            propiedad:propiedades!propiedad_id(id, titulo)
        `)
        .not('foto_url', 'is', null)
        .not('propiedad_id', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error cargando validación de fotos:', error);
    }

    const fotos = (data || []).map((foto) => ({
        ...foto,
        usuario: Array.isArray(foto.usuario) ? foto.usuario[0] : foto.usuario,
        propiedad: Array.isArray(foto.propiedad) ? foto.propiedad[0] : foto.propiedad,
    }));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Validación de Fotos</h1>
                <p className={styles.subtitle}>
                    Revisa las fotos subidas y marca cuáles fueron aprobadas o rechazadas.
                </p>
            </header>
            <AdminFotosTable fotos={fotos} />
        </div>
    );
}
