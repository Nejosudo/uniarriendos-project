'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loginAction } from '../actions'
import styles from '../auth.module.css'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const searchParams = useSearchParams()
  const resetOk = searchParams.get('reset') === 'ok'
  const authCallbackError = searchParams.get('error') === 'auth_callback'

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>UniArriendos</h1>
        <p className={styles.authSubtitle}>¡Bienvenido de nuevo!</p>

        {resetOk && (
          <div className={styles.successMsg}>
            Contraseña actualizada. Ya puedes iniciar sesión.
          </div>
        )}

        {authCallbackError && (
          <div className={styles.errorMsg}>
            No se pudo completar la verificación. Intenta de nuevo o solicita un nuevo enlace.
          </div>
        )}

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

          <div className={styles.inputGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="password">Contraseña</label>
              <Link href="/olvide-contrasena" className={styles.forgotLink}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input 
              type="password" 
              id="password" 
              name="password" 
              className={styles.input} 
              placeholder="Escribe tu contraseña"
              required 
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isPending}>
            {isPending ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <div className={styles.authLinks}>
          <span>¿No tienes una cuenta?</span>
          <Link href="/registro">Regístrate Aquí</Link>
        </div>
      </div>
    </div>
  )
}
