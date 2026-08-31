import Link from 'next/link';
import styles from './legal.module.css';

export default function NotFound() {
  return (
    <main className={styles.main}>
      <article className={styles.content} style={{ textAlign: 'center' }}>
        <p className={styles.eyebrow}>Error 404</p>
        <h1 className={styles.title}>Página no encontrada</h1>
        <p className={styles.updated}>La ruta que buscaste no existe o fue movida. Verifica la URL o vuelve al explorador.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/explorar" className={styles.buttonLink}>Explorar propiedades</Link>
          <Link href="/soporte" className={styles.buttonLink} style={{ background: 'white', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>Ir a soporte</Link>
        </div>
      </article>
    </main>
  );
}
