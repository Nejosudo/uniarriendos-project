import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import PropertyCard from '@/componentes/ui/PropertyCard/PropertyCard';
import { getRestriccionesUsuario } from '@/lib/suspensiones/guard';
import { calcularPromedioResenas } from '@/lib/resenas/utils';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
    title: 'UniArriendos - Arriendos para universitarios de UNIPAZ',
    description: 'Encuentra tu próximo arriendo para la comunidad universitaria de UNIPAZ en Barrancabermeja con reseñas, fotos y ubicación en tiempo real.',
    keywords: ['arriendos Barrancabermeja', 'habitaciones universitarios', 'UNIPAZ', 'apartamentos estudiantes'],
    alternates: {
        canonical: 'https://uniarriendos-project.vercel.app',
    },
};

export default async function Home() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const restricciones = await getRestriccionesUsuario();
  const favoritosDeshabilitados = !!user && !restricciones.puedeUsarFavoritos;

  let favoritosIds = new Set<string>();
  if (user) {
      const { data: favs } = await supabase
          .from('favoritos')
          .select('propiedad_id')
          .eq('usuario_id', user.id);
      
      if (favs) {
          favs.forEach(f => favoritosIds.add(f.propiedad_id.toString()));
      }
  }

  // Fetch solo 3 propiedades destacadas/recientes para la landing
  const { data: propiedades, error } = await supabase
    .from('propiedades')
    .select(`
            *,
            anfitrion:perfiles!propiedades_propietario_id_fkey (nombre_completo, avatar_url),
            propiedades_fotos (url),
            servicios_rel:propiedades_servicios (
                servicio:servicios (nombre, icono)
            ),
            resenas (calificacion, reportada)
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
            Encuentra habitaciones, apartaestudios y casas. Sin intermediarios, directo con los dueños.
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
              <h3>Propiedades Verificadas</h3>
              <p>Fomentamos la transparencia. El equipo admin revisa e identifica las propiedades con badge de verificación.</p>
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
                const resumenResenas = calcularPromedioResenas(prop.resenas);

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
                      verificada={prop.verificada}
                      perfil_arriendo={prop.perfil_arriendo}
                      anfitrion_nombre={anfitrion?.nombre_completo}
                      anfitrion_avatar={anfitrion?.avatar_url}
                      servicios={servicios}
                      isFavorite={favoritosIds.has(prop.id.toString())}
                      favoritosDeshabilitados={favoritosDeshabilitados}
                      calificacionPromedio={resumenResenas?.promedio ?? null}
                      totalResenas={resumenResenas?.total ?? 0}
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
