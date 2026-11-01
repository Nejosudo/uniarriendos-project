import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PqrsForm from '@/componentes/dashboard/PqrsForm/PqrsForm';
import { obtenerPrecioVerificacion } from '@/lib/configuracion';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './page.module.css';

interface NuevaPqrsPageProps {
    searchParams: Promise<{ verificacion?: string }> | { verificacion?: string };
}

export default async function NuevaPqrsPage({ searchParams }: NuevaPqrsPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const params = await searchParams;
    const propiedadId = Number(params?.verificacion);
    let valoresIniciales: { tipo: 'peticion'; asunto: string; mensaje: string } | undefined;

    if (Number.isInteger(propiedadId) && propiedadId > 0) {
        const { data: propiedad } = await supabase
            .from('propiedades')
            .select('id, titulo, propietario_id')
            .eq('id', propiedadId)
            .maybeSingle();

        if (propiedad && propiedad.propietario_id === user.id) {
            const precio = await obtenerPrecioVerificacion();
            const precioFormateado = new Intl.NumberFormat('es-CO').format(precio);
            valoresIniciales = {
                tipo: 'peticion',
                asunto: `Verificación de propiedad costo: ${precioFormateado}`,
                mensaje: `Título de propiedad: ${propiedad.titulo}\n\nSolicito la verificación de mi propiedad. Costo: $${precioFormateado} COP.`,
            };
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/dashboard/pqrs" className={styles.backBtn}>
                    <DynamicIcon name="ArrowLeft" size={20} />
                    Volver
                </Link>
                <div className={styles.titleWrapper}>
                    <h1 className={styles.title}>Nueva Solicitud PQRS</h1>
                    <p className={styles.subtitle}>
                        Cuéntanos tu petición, queja, reclamo o sugerencia. Te responderemos lo antes posible.
                    </p>
                </div>
            </div>

            <div className={styles.formContainer}>
                <PqrsForm initialValues={valoresIniciales} />
            </div>
        </div>
    );
}
