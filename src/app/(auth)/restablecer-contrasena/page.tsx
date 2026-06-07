import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ResetPasswordForm from './ResetPasswordForm'
import styles from '../auth.module.css'

export default async function RestablecerContrasenaPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const sessionValida = !!user

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h1 className={styles.authTitle}>Nueva contraseña</h1>
                <p className={styles.authSubtitle}>
                    Elige una contraseña segura para tu cuenta.
                </p>

                {sessionValida ? (
                    <ResetPasswordForm />
                ) : (
                    <div className={styles.infoBox}>
                        <p>El enlace de recuperación no es válido o ya expiró.</p>
                        <p>Solicita uno nuevo para continuar.</p>
                    </div>
                )}

                <div className={styles.authLinks}>
                    {sessionValida ? (
                        <Link href="/login">Cancelar</Link>
                    ) : (
                        <Link href="/olvide-contrasena">Solicitar nuevo enlace</Link>
                    )}
                </div>
            </div>
        </div>
    )
}
