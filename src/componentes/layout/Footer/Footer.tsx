import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.copyright}>
                    UniArriendos ©2026 Todos los derechos reservados
                </div>
                <div className={styles.links}>
                    <Link href="/privacidad">Privacidad</Link>
                    <Link href="/terminos">Términos</Link>
                    <Link href="/soporte">Soporte</Link>
                </div>
            </div>
        </footer>
    );
}
