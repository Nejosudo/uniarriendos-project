import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PropertyForm from '@/componentes/dashboard/PropertyForm/PropertyForm';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import Link from 'next/link';
import styles from './page.module.css';

export default async function CrearPropiedadPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Obtener la lista de servicios disponibles de la BD
    const { data: servicios } = await supabase
        .from('servicios')
        .select('*')
        .order('nombre', { ascending: true });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/dashboard/propiedades" className={styles.backBtn}>
                    <DynamicIcon name="ArrowLeft" size={20} />
                    Volver
                </Link>
                <div className={styles.titleWrapper}>
                    <h1 className={styles.title}>Publicar Nueva Propiedad</h1>
                    <p className={styles.subtitle}>Completa los detalles de tu espacio para que los estudiantes puedan encontrarlo.</p>
                </div>
            </div>

            <div className={styles.formContainer}>
                <PropertyForm serviciosDisponibles={servicios || []} />
            </div>
        </div>
    );
}
