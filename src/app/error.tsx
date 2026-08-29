'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import styles from './legal.module.css';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.main}>
      <article className={styles.content} style={{ textAlign: 'center' }}>
        <p className={styles.eyebrow}>Algo salió mal</p>
        <h1 className={styles.title}>Error inesperado</h1>
        <p className={styles.updated}>Ocurrió un problema al cargar esta página. Intenta de nuevo o contacta soporte si persiste.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => reset()} className={styles.buttonLink} style={{ border: 'none', cursor: 'pointer' }}>Reintentar</button>
          <Link href="/dashboard/pqrs/nueva" className={styles.buttonLink} style={{ background: 'white', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>Reportar en PQRS</Link>
        </div>
      </article>
    </main>
  );
}
