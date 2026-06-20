import styles from './page.module.css';

export default function Nosotros() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Sobre <span className={styles.highlight}>UniArriendos</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Conoce más sobre nuestra plataforma y cómo estamos transformando la búsqueda de vivienda para estudiantes.
          </p>
        </div>
      </section>

      <div className={styles.sectionsContainer}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>¿Quiénes somos?</h2>
          <div className={styles.sectionContent}>
            <p>
              UniArriendos es una plataforma dedicada a facilitar la búsqueda de vivienda para estudiantes de la Universidad de la Paz (UNIPAZ) y personas externas que buscan opciones cercanas a la universidad.
            </p>
            <p>
              Nuestra misión es conectar a estudiantes con anfitriones verificados, ofreciendo un proceso transparente, seguro y sin intermediarios.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Nuestra misión</h2>
          <div className={styles.sectionContent}>
            <p>
              Proporcionar una plataforma accesible y confiable donde los estudiantes puedan encontrar vivienda de calidad cerca de la UNIPAZ, y los anfitriones puedan publicar sus propiedades de manera sencilla y segura.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Nuestra visión</h2>
          <div className={styles.sectionContent}>
            <p>
              Ser la plataforma líder en arriendos para estudiantes en la región, reconocida por su transparencia, seguridad y compromiso con la comunidad universitaria.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>El equipo</h2>
          <div className={styles.sectionContent}>
            <p>
              UniArriendos es desarrollado por un equipo de estudiantes y profesionales comprometidos con mejorar la experiencia de búsqueda de vivienda para la comunidad universitaria.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Valores</h2>
          <div className={styles.sectionContent}>
            <ul>
              <li><strong>Transparencia:</strong> Ofrecemos información clara y verificada sobre cada propiedad.</li>
              <li><strong>Seguridad:</strong> Todos nuestros anfitriones son verificados para garantizar tu tranquilidad.</li>
              <li><strong>Accesibilidad:</strong> Facilitamos el acceso a vivienda de calidad para todos los estudiantes.</li>
              <li><strong>Comunidad:</strong> Fomentamos la conexión entre estudiantes y anfitriones para crear una comunidad universitaria más unida.</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Contacto</h2>
          <div className={styles.sectionContent}>
            <p>
              Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos a través de nuestro formulario de soporte o enviándonos un correo a <a href="mailto:soporte@uniarriendos.com" className={styles.emailLink}>soporte@uniarriendos.com</a>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}