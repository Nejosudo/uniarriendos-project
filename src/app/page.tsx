import { supabase } from '@/lib/supabase';
import PropertyCard from '@/componentes/ui/PropertyCard/PropertyCard';
import styles from './page.module.css';

export default async function Home() {
  // lógica del Backend
  const { data: propiedades, error } = await supabase.from('propiedades').select('*');

  if (error) {
    console.error('Error al obtener las propiedades:', error);
    return <div>Error al cargar las propiedades</div>;
  }

  // lógica del Frontend
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Uniarriendos - Propiedades disponibles</h1>

      <div className={styles.grid}>
        {/* Iteracción sobre el array de propiedades traidos de la BD */}
        {propiedades?.map((propiedad) => (
          <PropertyCard key={propiedad.id}
            titulo={propiedad.title}
            precio={propiedad.precio}
            ubicacion={propiedad.ubicacion}
            imagen_url={propiedad.imagen_url} />
        ))}
      </div>
    </main>
  );
}
