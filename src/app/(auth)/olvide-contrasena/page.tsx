'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { forgotPasswordAction } from '../actions'
import styles from '../auth.module.css'

export default function OlvideContrasenaPage() {
    const [state, formAction, isPending] = useActionState(forgotPasswordAction, null)

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h1 className={styles.authTitle}>Recuperar contraseña</h1>
                <p className={styles.authSubtitle}>
                    Te enviaremos un enlace para restablecer tu contraseña.
                </p>

                {state?.success ? (
                    <div className={styles.successMsg}>
                        {state.message}
                    </div>
                ) : (
                    <form action={formAction} className={styles.authForm}>
                        {state?.error && (
                            <div className={styles.errorMsg}>{state.error}</div>
                        )}

                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Correo Electrónico</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className={styles.input}
                                placeholder="ejemplo@unipaz.edu.co"
                                required
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={isPending}>
                            {isPending ? 'Enviando...' : 'Enviar enlace'}
                        </button>
                    </form>
                )}

                <div className={styles.authLinks}>
                    <Link href="/login">Volver al inicio de sesión</Link>
                </div>
            </div>
        </div>
    )
}
