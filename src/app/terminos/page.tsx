import type { Metadata } from 'next';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Términos y condiciones | UniArriendos',
  description: 'Consulta los términos y condiciones de uso de UniArriendos.',
};

export default function TerminosPage() {
  return (
    <main className={styles.main}>
      <article className={styles.content}>
        <p className={styles.eyebrow}>Información legal</p>
        {/* EDITAR AQUÍ: reemplaza el título y la fecha de actualización. */}
        <h1 className={styles.title}>Términos y condiciones</h1>
        <p className={styles.updated}>Última actualización: 19 de julio de 2026</p>

        {/* EDITAR AQUÍ: sustituye cada sección por los términos oficiales del servicio. */}
        <section className={styles.section}>
          <h2>1. Aceptación del servicio</h2>
          <p>Al crear una cuenta o utilizar UniArriendos aceptas estos términos y te comprometes a proporcionar información veraz y actualizada.</p>
        </section>
        <section className={styles.section}>
          <h2>2. Uso de la plataforma</h2>
          <p>UniArriendos facilita la publicación y búsqueda de viviendas. Cada usuario es responsable de sus publicaciones, comunicaciones y acuerdos.</p>
        </section>
        <section className={styles.section}>
          <h2>3. Publicaciones y conducta</h2>
          <p>No está permitido publicar información falsa, contenido ilegal, datos de terceros sin autorización o material que afecte la seguridad de la comunidad.</p>
        </section>
        <section className={styles.section}>
          <h2>4. Moderación</h2>
          <p>Podemos revisar, ocultar o retirar contenido que incumpla estos términos y aplicar restricciones a las cuentas cuando sea necesario.</p>
        </section>
        <section className={styles.section}>
          <h2>5. Contacto</h2>
          {/* EDITAR AQUÍ: cambia este correo por el canal oficial de términos. */}
          <p><a className={styles.contactLink} href="mailto:soporte@uniarriendos.com">soporte@uniarriendos.com</a></p>
        </section>
      </article>
    </main>
  );
}
