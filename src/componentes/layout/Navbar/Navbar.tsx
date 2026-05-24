import Link from 'next/link';
import styles from './Navbar.module.css';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '@/app/(auth)/actions';

export default async function Navbar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let avatarUrl = null;
    let nombre = '';
    let isAdmin = false;

    if (user) {
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('avatar_url, nombre_completo, rol')
            .eq('id', user.id)
            .single();

        avatarUrl = perfil?.avatar_url;
        nombre = perfil?.nombre_completo || '';
        isAdmin = perfil?.rol === 'admin';
    }

    return (
        <nav className={styles.navbar}>
            <Link href="/" className={styles.logo}>Uniarriendos</Link>

            <ul className={styles.navLinks}>
                <li><Link href="/">Inicio</Link></li>
                <li><Link href="/explorar">Explorar</Link></li>
                <li><Link href="/nosotros">Nosotros</Link></li>
            </ul>

            {user ? (
                <div className={styles.userMenu}>
                    {isAdmin && (
                        <Link href="/admin" className={styles.adminLink}>
                            Admin
                        </Link>
                    )}
                    <Link href="/dashboard/perfil" className={styles.avatarContainer} title={nombre}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className={styles.avatar} />
                        ) : (
                            <div className={styles.defaultAvatar}>
                                {nombre ? nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                    </Link>
                    <form action={logoutAction}>
                        <button type="submit" className={styles.logoutBtn}>Salir</button>
                    </form>
                </div>
            ) : (
                <Link href="/login" className={styles.authButton}>Iniciar Sesión</Link>
            )}
        </nav>
    );
}