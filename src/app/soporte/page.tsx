import Link from 'next/link';
import type { Metadata } from 'next';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Soporte | UniArriendos',
  description: 'Encuentra los canales de soporte de UniArriendos.',
};

export default function SoportePage() {
  return (
    <main className={styles.main}>
      <article className={styles.content}>
        <p className={styles.eyebrow}>Ayuda y contacto</p>
        {/* EDITAR AQUÍ: cambia el título y la información de atención. */}
        <h1 className={styles.title}>Soporte</h1>
        <p className={styles.updated}>Estamos aquí para ayudarte con tu cuenta o tus publicaciones.</p>

        {/* EDITAR AQUÍ: reemplaza horarios, correo y canales por los oficiales. */}
        <section className={styles.section}>
          <h2>¿Necesitas ayuda?</h2>
          <p>Para reportar un problema, realizar una solicitud o enviar una sugerencia, utiliza nuestro formulario PQRS.</p>
          <Link className={styles.buttonLink} href="/dashboard/pqrs/nueva">Ir al formulario PQRS</Link>
        </section>
        <section className={styles.section}>
          <h2>Contacto directo</h2>
          <p>También puedes escribirnos al correo <a className={styles.contactLink} href="mailto:soporte@uniarriendos.com">soporte@uniarriendos.com</a>.</p>
        </section>
        <section className={styles.section}>
          <h2>Horario de atención</h2>
          <p>Lunes a viernes, de 8:00 a. m. a 5:00 p. m.</p>
        </section>
      </article>
    </main>
  );
}
