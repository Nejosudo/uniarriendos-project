'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerAction } from '../actions'
import styles from '../auth.module.css'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null)

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>UniArriendos</h1>
        <p className={styles.authSubtitle}>Únete a nuestra gran comunidad</p>

        <form action={formAction} className={styles.authForm}>
          {state?.error && (
            <div className={styles.errorMsg}>{state.error}</div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="nombre">Nombre Completo</label>
            <input 
              type="text" 
              id="nombre" 
              name="nombre" 
              className={styles.input} 
              placeholder="Ingresa tu nombre aquí"
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              className={styles.input} 
              placeholder="ejemplo@unipaz.edu.co o tu correo"
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
              placeholder="Crea tu contraseña aquí"
              minLength={6}
              required 
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isPending}>
            {isPending ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className={styles.authLinks}>
          <span>¿Ya tienes una cuenta?</span>
          <Link href="/login">Inicia Sesión</Link>
        </div>
      </div>
    </div>
  )
}
