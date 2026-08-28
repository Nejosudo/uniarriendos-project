import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import PropertyCard from '@/componentes/ui/PropertyCard/PropertyCard';
import { getRestriccionesUsuario } from '@/lib/suspensiones/guard';
import { calcularPromedioResenas } from '@/lib/resenas/utils';
import ExplorarFilters from '@/componentes/explorar/ExplorarFilters/ExplorarFilters';
import TopSearchBar from '@/componentes/explorar/TopSearchBar/TopSearchBar';
import ExplorarMap from '@/componentes/explorar/ExplorarMap/ExplorarMap';
import styles from './page.module.css';

export const metadata: Metadata = {
    title: 'Explorar arriendos - Busca tu próxima vivienda | UniArriendos',
    description: 'Explora opciones de arriendo en Barrancabermeja para la comunidad universitaria de UNIPAZ. Filtra por precio, tipo de vivienda y servicios. Encuentra tu próxima habitación, apartamento o casa.',
    keywords: ['explorar arriendos', 'buscar habitación', 'apartamentos Barrancabermeja', 'vivienda estudiantes'],
    openGraph: {
        type: 'website',
        locale: 'es_CO',
        url: 'https://uniarriendos-project.vercel.app/explorar',
        title: 'Explorar arriendos disponibles',
        description: 'Cientos de opciones de arriendo para estudiantes y externos en Barrancabermeja',
        siteName: 'UniArriendos',
    },
    alternates: {
        canonical: 'https://uniarriendos-project.vercel.app/explorar',
    },
};

export default async function Explorar({ searchParams }: { searchParams: any }) {
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

    const params = await searchParams;
    
    // Extraer parámetros de búsqueda de la URL
    const q = params.q as string;
    const precio_rango = params.precio_rango as string;
    const tipo = params.tipo as string;
    const compartida = params.compartida === 'true';
    const vista = (params.vista as string) || 'lista';

    // Construir la consulta dinámicamente
    let query = supabase
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
        .in('estado', ['disponible', 'ocupado']);

    // Aplicar filtros a la consulta
    if (q) {
        query = query.or(`titulo.ilike.%${q}%,ubicacion_texto.ilike.%${q}%,descripcion.ilike.%${q}%`);
    }
    
    if (precio_rango) {
        const [minStr, maxStr] = precio_rango.split('-');
        if (minStr) query = query.gte('precio', parseInt(minStr, 10));
        if (maxStr) query = query.lte('precio', parseInt(maxStr, 10));
    }
    
    if (tipo) {
        query = query.in('perfil_arriendo', [tipo, 'ambos']);
    }
    if (compartida) {
        query = query.eq('vivienda_compartida', true);
    }

    // Ejecutar consulta ordenando por más reciente
    const { data: propiedades, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando propiedades en explorar:", error);
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Explorar Propiedades</h1>
                <p className={styles.subtitle}>Encuentra el lugar ideal para vivir cerca a la UNIPAZ.</p>
            </div>
            
            <TopSearchBar />
            
            <div className={styles.layout}>
                {/* Contenido Principal */}
                <div className={styles.mainContent}>
                    {error ? (
                        <div className={styles.error}>Ocurrió un error al cargar las propiedades.</div>
                    ) : !propiedades || propiedades.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No se encontraron propiedades que coincidan con tu búsqueda.</p>
                            <span className={styles.emptySub}>Intenta usar filtros más amplios o limpia la búsqueda.</span>
                        </div>
                    ) : vista === 'mapa' ? (
                        // VISTA MAPA
                        <ExplorarMap propiedades={propiedades} />
                    ) : (
                        // VISTA LISTA (Cuadrícula)
                        <div className={styles.grid}>
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

                {/* Sidebar (Filtros fijos a la derecha) */}
                <aside className={styles.sidebar}>
                    <div className={styles.stickyWrapper}>
                        <ExplorarFilters />
                    </div>
                </aside>
            </div>
        </div>
    );
}
