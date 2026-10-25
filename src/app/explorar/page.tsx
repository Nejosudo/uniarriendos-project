import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getRestriccionesUsuario } from '@/lib/suspensiones/guard';
import ExplorarFilters from '@/componentes/explorar/ExplorarFilters/ExplorarFilters';
import ExplorarView from '@/componentes/explorar/ExplorarView';
import styles from './page.module.css';
import { getClientIp } from '@/lib/rateLimit';
import { getSiteUrl } from '@/lib/siteUrl';
import type { PropiedadLista } from '@/lib/tipos';
import type { SemanticFilters, SemanticResult } from '@/lib/search/semantic';

export const metadata: Metadata = {
    title: 'Explorar arriendos - Busca tu próxima vivienda | UniArriendos',
    description: 'Explora opciones de arriendo en Barrancabermeja para la comunidad universitaria de UNIPAZ. Filtra por precio, tipo de vivienda y servicios. Encuentra tu próxima habitación, apartamento o casa.',
    keywords: ['explorar arriendos', 'buscar habitación', 'apartamentos Barrancabermeja', 'vivienda estudiantes'],
    openGraph: {
        type: 'website',
        locale: 'es_CO',
        url: `${getSiteUrl()}/explorar`,
        title: 'Explorar arriendos disponibles',
        description: 'Cientos de opciones de arriendo para estudiantes y externos en Barrancabermeja',
        siteName: 'UniArriendos',
    },
    alternates: {
        canonical: `${getSiteUrl()}/explorar`,
    },
};

type ExplorarSearch = Promise<Record<string, string | string[] | undefined>>;

export default async function Explorar({ searchParams }: { searchParams: ExplorarSearch }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const restricciones = await getRestriccionesUsuario();
    const favoritosDeshabilitados = !!user && !restricciones.puedeUsarFavoritos;

    const favoritosIds = new Set<string>();
    if (user) {
        const { data: favs } = await supabase
            .from('favoritos')
            .select('propiedad_id')
            .eq('usuario_id', user.id);
        
        if (favs) {
            favs.forEach(f => favoritosIds.add(f.propiedad_id.toString()));
        }
    }

    const params: Record<string, string | string[] | undefined> = await searchParams;
    
    // Extraer parámetros de búsqueda de la URL
    const q = params.q as string;
    const precio_rango = params.precio_rango as string;
    const compartidaParam = params.compartida as string | undefined;
    const verificada = params.verificada === 'true';
    const serviciosSeleccionados = [...new Set(
        String(params.servicios || '')
            .split(',')
            .map(Number)
            .filter((id) => Number.isInteger(id) && id > 0)
    )];
    const vista = (params.vista as string) || 'lista';

    const { data: serviciosDisponibles } = await supabase
        .from('servicios')
        .select('id, nombre, icono')
        .order('nombre');

    let idsConServicios: number[] | null = null;
    if (serviciosSeleccionados.length > 0) {
        const { data: relaciones, error: serviciosError } = await supabase
            .from('propiedades_servicios')
            .select('propiedad_id')
            .in('servicio_id', serviciosSeleccionados);

        if (serviciosError) {
            console.error('Error filtrando propiedades por servicios:', serviciosError);
        } else {
            const conteo = new Map<number, number>();
            (relaciones || []).forEach((relacion: { propiedad_id: number }) => {
                conteo.set(relacion.propiedad_id, (conteo.get(relacion.propiedad_id) || 0) + 1);
            });
            idsConServicios = [...conteo.entries()]
                .filter(([, cantidad]) => cantidad === serviciosSeleccionados.length)
                .map(([id]) => id);
        }
    }

    const isSemanticQuery = q && q.trim().split(/\s+/).length >= 2 && q.length >= 6;
    let semanticFiltros: SemanticFilters | null = null;
    let semanticResultados: PropiedadLista[] | null = null;
    let useSemantic = false;
    if (isSemanticQuery) {
        try {
            const h = await headers();
            const ip = getClientIp(h);
            const { searchSemantic } = await import('@/lib/search/semantic');
            const j: SemanticResult = await searchSemantic(q, ip);
            if ('error' in j) {
                console.error('Error búsqueda semántica:', j.error);
            } else if (j.resultados?.length) {
                useSemantic = true;
                semanticFiltros = j.filtros;
                semanticResultados = j.resultados;
            } else if (j.filtros) {
                semanticFiltros = j.filtros;
                if (j.filtros.compartida) useSemantic = true;
            }
        } catch (e) { console.error('semantic direct error', e); }
    }
    const fallbackCompartida = !useSemantic && isSemanticQuery && /compartir|compartida/i.test(q);

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

    // Si semantic detectó compartida pero no trajo resultados (filtros estrictos), aplica igual
    const semanticCompartida = semanticFiltros?.compartida === true;
    if (q && !useSemantic) {
        if (fallbackCompartida || semanticCompartida) query = query.eq('vivienda_compartida', true);
        if ((fallbackCompartida || semanticCompartida) && q.toLowerCase().includes('habitacion')) {
            query = query.or(`titulo.ilike.%habitacion%,descripcion.ilike.%habitacion%`);
        } else {
            query = query.or(`titulo.ilike.%${q}%,ubicacion_texto.ilike.%${q}%,descripcion.ilike.%${q}%`);
        }
    } else if (semanticCompartida && !useSemantic) {
        query = query.eq('vivienda_compartida', true);
    }
    
    if (precio_rango) {
        const [minStr, maxStr] = precio_rango.split('-');
        if (minStr) query = query.gte('precio', parseInt(minStr, 10));
        if (maxStr) query = query.lte('precio', parseInt(maxStr, 10));
    }
    
    if (compartidaParam === 'true') {
        query = query.eq('vivienda_compartida', true);
    } else if (compartidaParam === 'false') {
        query = query.eq('vivienda_compartida', false);
    }

    if (verificada) {
        query = query.eq('verificada', true);
    }

    if (idsConServicios && idsConServicios.length > 0) {
        query = query.in('id', idsConServicios);
    }

    const page = Math.max(1, parseInt(params.page as string, 10) || 1);
    const limit = 12;
    let propiedades: PropiedadLista[] | null = null;
    let error: unknown = null;
    const cumpleFiltrosActivos = (prop: PropiedadLista) => {
        if (compartidaParam === 'true' && !prop.vivienda_compartida) return false;
        if (compartidaParam === 'false' && prop.vivienda_compartida) return false;
        if (verificada && !prop.verificada) return false;
        if (idsConServicios && !idsConServicios.includes(prop.id)) return false;
        if (precio_rango) {
            const [minStr, maxStr] = precio_rango.split('-');
            const min = minStr ? parseInt(minStr, 10) : null;
            const max = maxStr ? parseInt(maxStr, 10) : null;
            if (min !== null && prop.precio < min) return false;
            if (max !== null && prop.precio > max) return false;
        }
        return true;
    };

    if (idsConServicios && idsConServicios.length === 0) {
        propiedades = [];
    } else if (useSemantic && semanticResultados) {
        propiedades = semanticResultados.filter(cumpleFiltrosActivos);
    } else {
        const res = await query.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
        propiedades = res.data; error = res.error;
    }

    if (error) {
        console.error("Error cargando propiedades en explorar:", error);
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Explorar Propiedades</h1>
                <p className={styles.subtitle}>Encuentra el lugar ideal para vivir cerca a la UNIPAZ.</p>
            </div>
            {error ? <div className={styles.error}>Ocurrió un error al cargar las propiedades.</div> : !propiedades || propiedades.length === 0 ? (
                <div className={styles.layout}>
                    <div className={styles.mainContent}>
                        <div className={styles.empty}>
                            <p>No se encontraron propiedades que coincidan con tu búsqueda.</p>
                            <span className={styles.emptySub}>Intenta usar filtros más amplios o limpia la búsqueda.</span>
                        </div>
                    </div>
                    <aside className={styles.sidebar}>
                        <div className={styles.stickyWrapper}>
                            <ExplorarFilters serviciosDisponibles={serviciosDisponibles || []} />
                        </div>
                    </aside>
                </div>
            ) : (
                <ExplorarView propiedades={propiedades} favoritosIds={favoritosIds} favoritosDeshabilitados={favoritosDeshabilitados} q={q} useSemantic={useSemantic} vistaInicial={vista} page={page} params={params} serviciosDisponibles={serviciosDisponibles || []} />
            )}
        </div>
    );
}
