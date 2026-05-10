'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction } from '../actions'
import styles from '../auth.module.css'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>UniArriendos</h1>
        <p className={styles.authSubtitle}>¡Bienvenido de nuevo!</p>

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
            <label htmlFor="password">Contraseña</label>
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
