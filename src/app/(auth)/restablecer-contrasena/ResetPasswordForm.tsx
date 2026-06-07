'use client'

import { useActionState } from 'react'
import { resetPasswordAction } from '../actions'
import styles from '../auth.module.css'

export default function ResetPasswordForm() {
    const [state, formAction, isPending] = useActionState(resetPasswordAction, null)

    return (
        <form action={formAction} className={styles.authForm}>
            {state?.error && (
                <div className={styles.errorMsg}>{state.error}</div>
            )}

            <div className={styles.inputGroup}>
                <label htmlFor="password">Nueva contraseña</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    className={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                />
            </div>

            <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className={styles.input}
                    placeholder="Repite la contraseña"
                    minLength={6}
                    required
                />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isPending}>
                {isPending ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
        </form>
    )
}
