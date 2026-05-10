import { createClient } from '@/lib/supabase/server';
import PropertyCard from '@/componentes/ui/PropertyCard/PropertyCard';
import Link from 'next/link';
import styles from './page.module.css';

export default async function Home() {
  const supabase = await createClient();

  // Fetch solo 3 propiedades destacadas/recientes para la landing
  const { data: propiedades, error } = await supabase
    .from('propiedades')
    .select(`
            *,
            anfitrion:perfiles!propiedades_propietario_id_fkey (nombre_completo, avatar_url),
            propiedades_fotos (url),
            servicios_rel:propiedades_servicios (
                servicio:servicios (nombre, icono)
            )
        `)
    .in('estado', ['disponible', 'ocupado'])
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error al obtener las propiedades:', error);
  }

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Tu hogar ideal cerca de la <span className={styles.highlight}>UNIPAZ</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Encuentra habitaciones, apartaestudios y casas verificadas. Sin intermediarios, directo con los dueños.
          </p>
          
          <div className={styles.heroActions}>
            <Link href="/explorar" className={styles.btnPrimaryLarge}>
              Explorar Propiedades
            </Link>
            <Link href="/registro" className={styles.btnOutlineLarge}>
              Soy Propietario
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefits}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>¿Por qué elegir UniArriendos?</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>📍</div>
              <h3>Cerca a la Universidad</h3>
              <p>Filtramos opciones pensadas estratégicamente para estudiantes de la UNIPAZ y externos.</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>🛡️</div>
              <h3>Anfitriones Verificados</h3>
              <p>Protegemos tu seguridad. Solo dueños con identidad comprobada pueden publicar en la plataforma.</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>⚡</div>
              <h3>Contacto Directo</h3>
              <p>Sin comisiones abusivas ni papeleos. Contacta por WhatsApp al anfitrión con un solo clic.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recents Properties Section */}
      <section className={styles.recent}>
        <div className={styles.container}>
          <div className={styles.recentHeader}>
            <h2 className={styles.sectionTitle}>Propiedades Recientes</h2>
            <Link href="/explorar" className={styles.viewAllLink}>
              Ver todas →
            </Link>
          </div>
          
          {error ? (
            <p>Ocurrió un error cargando las propiedades recientes.</p>
          ) : !propiedades || propiedades.length === 0 ? (
            <p>Aún no hay propiedades publicadas. ¡Sé el primero!</p>
          ) : (
            <div className={styles.propertiesGrid}>
              {propiedades.map((prop: any) => {
                const anfitrion = prop.anfitrion;
                const fotos = prop.propiedades_fotos;
                const imagenPrincipal = fotos && fotos.length > 0 ? fotos[0].url : undefined;
                const servicios = prop.servicios_rel?.map((s: any) => s.servicio) || [];

                return (
                  <PropertyCard 
                      key={prop.id}
                      id={prop.id}
                      titulo={prop.titulo}
                      precio={prop.precio}
                      ubicacion_texto={prop.ubicacion_texto}
                      imagen_url={imagenPrincipal}
                      vivienda_compartida={prop.vivienda_compartida}
                      estado={prop.estado}
                      prioridad={prop.prioridad}
                      perfil_arriendo={prop.perfil_arriendo}
                      anfitrion_nombre={anfitrion?.nombre_completo}
                      anfitrion_avatar={anfitrion?.avatar_url}
                      servicios={servicios}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className={styles.ctaBottom}>
        <div className={styles.ctaContent}>
          <h2>¿Tienes una habitación o casa disponible?</h2>
          <p>Únete a nuestra comunidad de anfitriones y alquila tu espacio a estudiantes responsables.</p>
          <Link href="/registro" className={styles.btnSecondaryLarge}>
            Publicar mi propiedad
          </Link>
        </div>
      </section>
    </main>
  );
}
