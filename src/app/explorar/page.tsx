import { createClient } from '@/lib/supabase/server';
import PropertyCard from '@/componentes/ui/PropertyCard/PropertyCard';
import styles from './page.module.css';

export default async function ExplorarPage() {
    const supabase = await createClient();
    
    const { data: propiedades, error } = await supabase
        .from('propiedades')
        .select(`
            *,
            anfitrion:perfiles!propiedades_propietario_id_fkey (nombre_completo, avatar_url),
            propiedades_fotos (url)
        `)
        .in('estado', ['disponible', 'ocupado'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando propiedades en explorar:", error);
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Explorar Propiedades</h1>
                <p className={styles.subtitle}>Encuentra el lugar ideal para vivir cerca a la UNIPAZ.</p>
            </div>
            
            <div className={styles.filtersBar}>
                Filtros de búsqueda (Próximamente...)
            </div>

            {error ? (
                <div className={styles.error}>Ocurrió un error al cargar las propiedades.</div>
            ) : !propiedades || propiedades.length === 0 ? (
                <div className={styles.empty}>No hay propiedades disponibles en este momento.</div>
            ) : (
                <div className={styles.grid}>
                    {propiedades.map((prop: any) => {
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
            )}
        </div>
    );
}
