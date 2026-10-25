import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <Link href="/" className={styles.brand} aria-label="UniArriendos, ir al inicio">
                    <Image
                        src="/brand/uniarriendos_logo_horizontal_oscuro.png"
                        alt="UniArriendos"
                        width={2020}
                        height={400}
                        className={styles.brandImage}
                    />
                </Link>
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
