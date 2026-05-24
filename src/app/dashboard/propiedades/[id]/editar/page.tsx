import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import PropertyForm from '@/componentes/dashboard/PropertyForm/PropertyForm';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import Link from 'next/link';
import styles from './page.module.css';

interface EditarPropiedadPageProps {
    params: Promise<{ id: string }> | { id: string };
}

import { redirectSiSuspendido } from '@/lib/suspensiones/guard';

export default async function EditarPropiedadPage({ params }: EditarPropiedadPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    await redirectSiSuspendido();

    // Await params since it can be a Promise in Next.js 15
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Obtener propiedad con fotos y servicios
    const { data: propiedad, error } = await supabase
        .from('propiedades')
        .select(`
            *,
            propiedades_fotos(url, orden),
            propiedades_servicios(servicio_id)
        `)
        .eq('id', id)
        .single();

    if (error || !propiedad) {
        return notFound();
    }

    // Validar propietario
    if (propiedad.propietario_id !== user.id) {
        redirect('/dashboard/propiedades');
    }

    // Obtener la lista de todos los servicios disponibles de la BD
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
                    <h1 className={styles.title}>Editar Propiedad</h1>
                    <p className={styles.subtitle}>Modifica los detalles de tu publicación para mantenerla actualizada.</p>
                </div>
            </div>

            <div className={styles.formContainer}>
                <PropertyForm 
                    serviciosDisponibles={servicios || []} 
                    initialData={propiedad}
                    isEditing={true}
                    propiedadId={propiedad.id}
                />
            </div>
        </div>
    );
}
