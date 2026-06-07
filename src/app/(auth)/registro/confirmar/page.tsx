import Link from 'next/link'
import styles from '../../auth.module.css'

interface ConfirmarPageProps {
    searchParams: Promise<{ email?: string }>
}

export default async function ConfirmarRegistroPage({ searchParams }: ConfirmarPageProps) {
    const { email } = await searchParams

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h1 className={styles.authTitle}>Revisa tu correo</h1>
                <p className={styles.authSubtitle}>
                    {email
                        ? `Enviamos un enlace de confirmación a ${email}.`
                        : 'Enviamos un enlace de confirmación a tu correo.'}
                </p>

                <div className={styles.infoBox}>
                    <p>Abre el correo y haz clic en el enlace para activar tu cuenta.</p>
                    <p>Si no lo ves, revisa la carpeta de spam o correo no deseado.</p>
                </div>

                <div className={styles.authLinks}>
                    <Link href="/login">Ya confirmé — Iniciar sesión</Link>
                </div>
            </div>
        </div>
    )
}
