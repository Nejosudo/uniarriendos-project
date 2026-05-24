import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PqrsList from '@/componentes/dashboard/PqrsList/PqrsList';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './page.module.css';

export default async function PqrsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: pqrs, error } = await supabase
        .from('pqrs')
        .select(`
            id,
            tipo,
            asunto,
            mensaje,
            estado,
            created_at,
            updated_at,
            pqrs_respuestas (
                id,
                mensaje,
                created_at
            )
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al obtener PQRS:', error);
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Mis PQRS</h1>
                    <p className={styles.subtitle}>
                        Peticiones, quejas, reclamos y sugerencias enviadas a la plataforma.
                    </p>
                </div>
                <Link href="/dashboard/pqrs/nueva" className={styles.createBtn}>
                    <DynamicIcon name="Plus" size={20} />
                    Nueva Solicitud
                </Link>
            </div>

            <PqrsList pqrs={pqrs || []} />
        </div>
    );
}
