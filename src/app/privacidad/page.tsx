import type { Metadata } from 'next';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Política de privacidad | UniArriendos',
  description: 'Consulta cómo UniArriendos trata y protege tus datos personales.',
};

export default function PrivacidadPage() {
  return (
    <main className={styles.main}>
      <article className={styles.content}>
        <p className={styles.eyebrow}>Información legal</p>
        {/* EDITAR AQUÍ: reemplaza el título y la fecha de actualización. */}
        <h1 className={styles.title}>Política de privacidad</h1>
        <p className={styles.updated}>Última actualización: 19 de julio de 2026</p>

        {/* EDITAR AQUÍ: sustituye cada sección por la política oficial de tu proyecto. */}
        <section className={styles.section}>
          <h2>1. Información que recopilamos</h2>
          <p>Recopilamos los datos que proporcionas al crear tu cuenta, publicar una propiedad o contactar a otro usuario.</p>
        </section>
        <section className={styles.section}>
          <h2>2. Uso de la información</h2>
          <p>Usamos esta información para operar UniArriendos, mostrar publicaciones, facilitar contactos y mejorar la seguridad de la plataforma.</p>
        </section>
        <section className={styles.section}>
          <h2>3. Protección y conservación</h2>
          <p>Aplicamos medidas razonables para proteger la información y la conservamos durante el tiempo necesario para prestar el servicio o cumplir obligaciones legales.</p>
        </section>
        <section className={styles.section}>
          <h2>4. Tus derechos</h2>
          <p>Para solicitar consulta, corrección o eliminación de tus datos, escríbenos al correo definido por el responsable del proyecto.</p>
        </section>
        <section className={styles.section}>
          <h2>5. Contacto</h2>
          {/* EDITAR AQUÍ: cambia este correo por el canal oficial de privacidad. */}
          <p><a className={styles.contactLink} href="mailto:privacidad@uniarriendos.com">privacidad@uniarriendos.com</a></p>
        </section>
      </article>
    </main>
  );
}
