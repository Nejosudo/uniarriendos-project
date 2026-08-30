import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { getRestriccionesUsuario } from '@/lib/suspensiones/guard';
import ExplorarFilters from '@/componentes/explorar/ExplorarFilters/ExplorarFilters';
import ExplorarView from '@/componentes/explorar/ExplorarView';
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

    const isSemanticQuery = q && q.trim().split(/\s+/).length >= 2 && q.length >= 6;
    let semanticFiltros: any = null;
    let semanticResultados: any[] | null = null;
    let useSemantic = false;
    if (isSemanticQuery) {
        try {
            const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            const r = await fetch(`${base}/api/search/semantic?q=${encodeURIComponent(q)}`, { next: { revalidate: 300 } });
            if (r.ok) {
                const j = await r.json();
                if (j.resultados?.length) {
                    useSemantic = true;
                    semanticFiltros = j.filtros;
                    semanticResultados = j.resultados;
                }
            }
        } catch {}
    }

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
    if (q && !useSemantic) {
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

    const page = Math.max(1, parseInt(params.page as string, 10) || 1);
    const limit = 12;
    let propiedades: any[] | null = null;
    let error: any = null;
    if (useSemantic && semanticResultados) {
        propiedades = semanticResultados;
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
                <><div className={styles.empty}><p>No se encontraron propiedades que coincidan con tu búsqueda.</p><span className={styles.emptySub}>Intenta usar filtros más amplios o limpia la búsqueda.</span></div><div className={styles.layout}><aside className={styles.sidebar}><div className={styles.stickyWrapper}><ExplorarFilters /></div></aside></div></>
            ) : (
                <ExplorarView propiedades={propiedades} favoritosIds={favoritosIds} favoritosDeshabilitados={favoritosDeshabilitados} q={q} useSemantic={useSemantic} filtrosInicial={semanticFiltros} vistaInicial={vista} page={page} params={params} />
            )}
        </div>
    );
}
