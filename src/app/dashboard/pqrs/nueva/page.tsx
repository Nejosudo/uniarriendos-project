import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PqrsForm from '@/componentes/dashboard/PqrsForm/PqrsForm';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './page.module.css';

export default async function NuevaPqrsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
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
                <PqrsForm />
            </div>
        </div>
    );
}
