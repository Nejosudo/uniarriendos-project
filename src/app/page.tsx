import { createClient } from '@/lib/supabase/server';
import PropertyCard from '@/componentes/ui/PropertyCard/PropertyCard';
import styles from './page.module.css';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();

  // Fetch solo 3 propiedades destacadas/recientes para la landing
  const { data: propiedades, error } = await supabase
    .from('propiedades')
    .select(`
            *,
            anfitrion:perfiles!propiedades_propietario_id_fkey (nombre_completo, avatar_url),
            propiedades_fotos (url)
        `)
    .in('estado', ['disponible', 'ocupado'])
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error al obtener las propiedades:', error);
    return <div className={styles.main}>Error al cargar las propiedades.</div>;
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Bienvenido a UniArriendos</h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
        Encuentra el lugar ideal para vivir cerca de la UNIPAZ.
      </p>

      {/* <div className={styles.grid}>
        {propiedades?.map((prop: any) => {
          const anfitrion = prop.anfitrion;
          const fotos = prop.propiedades_fotos;
          const imagenPrincipal = fotos && fotos.length > 0 ? fotos[0].url : undefined;

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
              />
          );
        })}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link href="/explorar" style={{ background: 'var(--color-primary)', color: 'white', padding: '0.8rem 2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            Ver todas las propiedades
          </Link>
      </div> */}
    </main>
  );
}
