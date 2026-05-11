import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import styles from './page.module.css';
import PerfilForm from '@/componentes/dashboard/PerfilForm/PerfilForm';

export default async function PerfilPage() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login');
    }

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mi Perfil</h1>
                <p className={styles.subtitle}>Gestiona tu información personal y verifica tu cuenta.</p>
            </div>

            <div className={styles.content}>
                {/* Componente cliente para manejar el formulario y estados interactivos */}
                <PerfilForm initialPerfil={perfil} email={user.email || ''} />
            </div>
        </div>
    );
}
