import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PropertiesTable from '@/componentes/dashboard/PropertiesTable/PropertiesTable';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import Link from 'next/link';
import styles from './page.module.css';

export default async function PropiedadesDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Obtener propiedades del usuario con count de favoritos
    const { data: propiedades, error } = await supabase
        .from('propiedades')
        .select(`
            *,
            propiedades_fotos (url, orden),
            favoritos_count:favoritos(count)
        `)
        .eq('propietario_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al obtener propiedades del dashboard:', error);
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Mis Propiedades</h1>
                    <p className={styles.subtitle}>Gestiona tus publicaciones, cambia su estado o edítalas.</p>
                </div>
                <Link href="/dashboard/propiedades/crear" className={styles.createBtn}>
                    <DynamicIcon name="Plus" size={20} />
                    Publicar Propiedad
                </Link>
            </div>

            <PropertiesTable propiedades={propiedades || []} />
        </div>
    );
}
