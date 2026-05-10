import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <Link href="/" className={styles.logo}>Uniarriendos</Link>

            <ul className={styles.navLinks}>
                <li><Link href="/">Inicio</Link></li>
                <li><Link href="/explorar">Explorar</Link></li>
                <li><Link href="/nosotros">Nosotros</Link></li>
            </ul>

            <Link href="/login" className={styles.authButton}>Iniciar Sesión</Link>
        </nav>
    );
}