import Image from 'next/image';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getRestriccionesUsuario } from '@/lib/suspensiones/guard';
import styles from './page.module.css';
import ImageGallery from './ImageGallery';
import ShareButton from '@/componentes/ui/ShareButton/ShareButton';
import FavoriteButton from '@/componentes/ui/FavoriteButton/FavoriteButton';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import PropertyDetailMap from '@/componentes/ui/PropertyDetailMap/PropertyDetailMap';
import ResenasSection from '@/componentes/propiedades/ResenasSection/ResenasSection';
import PreguntasSection from '@/componentes/propiedades/PreguntasSection/PreguntasSection';
import Link from 'next/link';
import { usuarioYaReseno, type ResenaConUsuario } from '@/app/acciones/resenasActions';
import type { PreguntaConUsuario } from '@/app/acciones/preguntasActions';
import { calcularPromedioResenas, formatearEstrellas } from '@/lib/resenas/utils';
import UserBadge from '@/componentes/ui/UserBadge/UserBadge';
import CotsemInfo from '@/componentes/ui/CotsemInfo/CotsemInfo';
import { getSiteUrl } from '@/lib/siteUrl';

import type { PropiedadLista } from '@/lib/tipos';

// Función para obtener propiedad (reutilizable para metadata y componente)
const obtenerPropiedad = cache(async (id: string): Promise<{ data: PropiedadDetalle | null; error: unknown }> => {
    const supabase = await createClient();
    const { data: propiedad, error } = await supabase
        .from('propiedades')
        .select(`
            *,
            anfitrion:perfiles!propiedades_propietario_id_fkey(nombre_completo, avatar_url, created_at, tipo),
            propiedades_fotos(url, orden),
            servicios_rel:propiedades_servicios(
                servicio:servicios(nombre, icono)
            ),
            resenas(
                *,
                usuario:perfiles(nombre_completo, avatar_url)
            ),
            preguntas(
                *,
                usuario:perfiles(nombre_completo, avatar_url)
            )
        `)
        .eq('id', id)
        .single();
    
    return { data: (propiedad ?? null) as PropiedadDetalle | null, error };
});

type PropiedadDetalle = Omit<PropiedadLista, 'resenas' | 'preguntas'> & {
    estado: 'disponible' | 'ocupado' | 'inactivo';
    verificada: boolean;
    vivienda_compartida: boolean;
    propietario_id: string;
    resenas: ResenaConUsuario[] | null;
    preguntas: PreguntaConUsuario[] | null;
};

// Metadata dinámica para cada propiedad
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const { id } = await params;
    const { data: propiedad } = await obtenerPropiedad(id);

    if (!propiedad) {
        notFound();
    }

    if (propiedad.estado === 'inactivo') {
        return {
            title: "Propiedad no encontrada",
            description: "La propiedad que buscas no está disponible en UniArriendos.",
        };
    }

    const base = getSiteUrl();
    const imagenPrincipal = propiedad.propiedades_fotos?.[0]?.url || `${base}/og-image.png`;
    const titulo = `${propiedad.titulo} - $${propiedad.precio?.toLocaleString('es-CO')} | UniArriendos`;
    const descripcion = propiedad.descripcion?.substring(0, 160) || `Arriendo en ${propiedad.ubicacion_texto} - ${propiedad.titulo}`;

    return {
        title: titulo,
        description: descripcion,
        keywords: [propiedad.titulo, propiedad.ubicacion_texto, 'arriendo', 'habitación', 'apartamento'],
        openGraph: {
            type: 'website',
            locale: 'es_CO',
            url: `${base}/propiedades/${id}`,
            title: propiedad.titulo,
            description: descripcion,
            siteName: 'UniArriendos',
            images: [
                {
                    url: imagenPrincipal,
                    width: 1200,
                    height: 630,
                    alt: propiedad.titulo,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: propiedad.titulo,
            description: descripcion,
            images: [imagenPrincipal],
        },
        alternates: {
            canonical: `${base}/propiedades/${id}`,
        },
    };
}

function jsonLdPropiedad(prop: PropiedadDetalle, fotos: string[]) {
  const base = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: prop.titulo,
    description: prop.descripcion?.slice(0, 300),
    image: fotos.length > 0 ? fotos : [`${base}/og-image.png`],
    url: `${base}/propiedades/${prop.id}`,
    offers: { '@type': 'Offer', price: prop.precio, priceCurrency: 'COP' },
    address: prop.ubicacion_texto,
  };
}

function serializarJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
export default async function PropiedadDetalle({ params }: { params: { id: string } }) {
    const { id } = await params;
    const { data: propiedad, error } = await obtenerPropiedad(id);

    if (error || !propiedad) {
        return notFound();
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (propiedad.estado === 'inactivo') {
        let esAdmin = false;
        if (user) {
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('id', user.id)
                .maybeSingle();
            esAdmin = perfil?.rol === 'admin';
        }

        if (!user || (user.id !== propiedad.propietario_id && !esAdmin)) {
            return notFound();
        }
    }

    const isLoggedIn = !!user;
    const restricciones = await getRestriccionesUsuario();
    const puedeVerContacto = isLoggedIn && restricciones.puedeVerContacto;
    const puedeUsarFavoritos = isLoggedIn && restricciones.puedeUsarFavoritos;
    const puedeInteractuar = isLoggedIn && restricciones.puedeInteractuarPublicaciones;

    let telefonoAnfitrion: string | null = null;
    if (puedeVerContacto) {
        const { data, error: telefonoError } = await supabase.rpc('get_telefono_propiedad', {
            p_propiedad_id: propiedad.id
        });
        if (!telefonoError) {
            telefonoAnfitrion = typeof data === 'string' ? data : null;
        } else {
            const { data: perfilAnfitrion } = await supabase
                .from('perfiles')
                .select('telefono')
                .eq('id', propiedad.propietario_id)
                .single();
            telefonoAnfitrion = perfilAnfitrion?.telefono ?? null;
        }
    }

    let isFavorite = false;
    if (user) {
        const { data: fav } = await supabase
            .from('favoritos')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('propiedad_id', propiedad.id)
            .single();
        if (fav) isFavorite = true;
    }

    // Normalizar datos
    const fotos = propiedad.propiedades_fotos?.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map((f) => f.url) || [];
    const servicios = (propiedad.servicios_rel?.map((s) => s.servicio).filter((s): s is NonNullable<typeof s> => !!s)) || [];
    const anfitrion = propiedad.anfitrion;
    const resenasVisibles = (propiedad.resenas || [])
        .filter((r) => !r.reportada)
        .sort(
            (a: { created_at: string }, b: { created_at: string }) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    const resumenResenas = calcularPromedioResenas(resenasVisibles);
    const yaReseno = user ? await usuarioYaReseno(Number(id)) : false;
    const esAnfitrion = !!user && user.id === propiedad.propietario_id;
    const preguntasOrdenadas: PreguntaConUsuario[] = (propiedad.preguntas || []).sort(
        (a: { created_at: string }, b: { created_at: string }) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const formatPrecio = (valor: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
    };

    const jsonLd = jsonLdPropiedad(propiedad, fotos);
    const telefonoDigitos = telefonoAnfitrion?.replace(/\D/g, '') ?? '';
    const telefonoWhatsapp = telefonoDigitos
        ? (telefonoDigitos.startsWith('57') ? telefonoDigitos : `57${telefonoDigitos}`)
        : '';
    return (
        <main className={styles.container}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializarJsonLd(jsonLd) }} />
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <h1 className={styles.title}>{propiedad.titulo}</h1>
                    <div className={styles.headerActions}>
                        <FavoriteButton
                            propiedadId={propiedad.id.toString()}
                            initialIsFavorite={isFavorite}
                            variant="labeled"
                            disabled={isLoggedIn && !puedeUsarFavoritos}
                        />
                        <ShareButton />
                    </div>
                </div>
                <p className={styles.location}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {propiedad.ubicacion_texto}
                </p>
                {resumenResenas && (
                    <p className={styles.ratingSummary}>
                        <span className={styles.ratingStars}>{formatearEstrellas(resumenResenas.promedio)}</span>
                        <span>
                            {resumenResenas.promedio} · {resumenResenas.total}{' '}
                            {resumenResenas.total === 1 ? 'reseña' : 'reseñas'}
                        </span>
                    </p>
                )}
            </div>

            <ImageGallery fotos={fotos} />

            <div className={styles.contentGrid}>
                {/* Columna Izquierda: Información */}
                <div className={styles.mainInfo}>
                    <div className={styles.tagsRow}>
                        {propiedad.estado === 'disponible' && <span className={styles.tagSuccess}>Disponible</span>}
                        {propiedad.estado === 'ocupado' && <span className={styles.tagError}>Ocupado</span>}
                        {propiedad.verificada && (
                            <span className={styles.tagSuccess} style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }} title="Revisada y verificada por el equipo de administración de UniArriendos">
                                ✓ Propiedad Verificada
                            </span>
                        )}
                        {propiedad.vivienda_compartida && <span className={styles.tagDefault}>Vivienda Compartida</span>}
                        {propiedad.perfil_arriendo && propiedad.perfil_arriendo !== 'ambos' && (
                            <span className={styles.tagDefault}>Solo {propiedad.perfil_arriendo}</span>
                        )}
                    </div>

                    <section className={styles.section}>
                        <h2>Acerca de este lugar</h2>
                        <p className={styles.description}>{propiedad.descripcion}</p>
                    </section>

                    <section className={styles.section}>
                        <h2>Servicios incluidos</h2>
                        {servicios.length > 0 ? (
                            <ul className={styles.servicesList}>
                                {servicios.map((srv, idx) => (
                                    <li key={idx} className={styles.serviceItem}>
                                        <DynamicIcon name={srv.icono} size={20} color="var(--color-primary)" />
                                        {srv.nombre}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.emptyMsg}>No se especificaron servicios.</p>
                        )}
                    </section>

                    {/* Sección de Mapa */}
                    {propiedad.ubicacion_lat && propiedad.ubicacion_lng && (
                        <section className={styles.section}>
                            <h2>Ubicación</h2>
                            <CotsemInfo lat={propiedad.ubicacion_lat} lng={propiedad.ubicacion_lng} />
                            <PropertyDetailMap 
                                lat={propiedad.ubicacion_lat} 
                                lng={propiedad.ubicacion_lng} 
                                                            />
                        </section>
                    )}

                    <ResenasSection
                        propiedadId={propiedad.id}
                        resenasIniciales={resenasVisibles}
                        puedeInteractuar={puedeInteractuar}
                        isLoggedIn={isLoggedIn}
                        yaReseno={yaReseno}
                    />

                    <section className={styles.section}>
                        <h2>Preguntas al Anfitrión</h2>
                        <PreguntasSection
                            propiedadId={propiedad.id}
                            preguntasIniciales={preguntasOrdenadas}
                            puedeInteractuar={puedeInteractuar}
                            isLoggedIn={isLoggedIn}
                            esAnfitrion={esAnfitrion}
                        />
                    </section>
                </div>

                {/* Columna Derecha: Tarjeta de Contacto */}
                <div className={styles.sidebar}>
                    <div className={styles.priceCard}>
                        <div className={styles.priceHeader}>
                            <span className={styles.price}>{formatPrecio(propiedad.precio)}</span>
                            <span className={styles.perMonth}>/ mes</span>
                        </div>
                        
                        <div className={styles.hostCard}>
                            <div className={styles.hostHeader}>
                                {anfitrion?.avatar_url ? (
                                    <Image src={anfitrion.avatar_url} alt={anfitrion.nombre_completo ? `Avatar de ${anfitrion.nombre_completo}` : 'Avatar anfitrión'} width={48} height={48} className={styles.hostAvatar} />
                                ) : (
                                    <div className={styles.defaultAvatar}>{anfitrion?.nombre_completo?.charAt(0).toUpperCase() || 'A'}</div>
                                )}
                                <div>
                                    <p className={styles.hostName}>
                                        {anfitrion?.nombre_completo || 'Anfitrión'}
                                        <UserBadge tipo={anfitrion?.tipo} className={styles.hostBadge} />
                                    </p>
                                     {propiedad.verificada ? (
                                         <p className={styles.hostSubtitle} style={{ color: 'var(--color-primary)', fontWeight: 600 }} title="Propiedad verificada por el equipo de administración">
                                             ✓ Propiedad verificada
                                         </p>
                                     ) : (
                                         <p className={styles.hostSubtitle}>Anfitrión registrado</p>
                                     )}
                                </div>
                            </div>

                            {puedeVerContacto ? (
                                <div className={styles.contactInfo}>
                                    <p className={styles.contactLabel}>Teléfono de contacto:</p>
                                    <p className={styles.contactPhone}>{telefonoAnfitrion || 'No proporcionado'}</p>
                                    {telefonoWhatsapp && (
                                        <a href={`https://wa.me/${telefonoWhatsapp}`} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp}>
                                            Contactar por WhatsApp
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.authPromptSidebar}>
                                    <p>
                                        {isLoggedIn && restricciones.suspendido
                                            ? 'Tu cuenta está suspendida (nivel 3) y no puedes ver la información de contacto.'
                                            : 'Inicia sesión para ver la información de contacto del anfitrión.'}
                                    </p>
                                    {!isLoggedIn && (
                                        <Link href="/login" className={styles.btnPrimaryFull}>Iniciar Sesión</Link>
                                    )}
                                    {isLoggedIn && restricciones.suspendido && (
                                        <Link href="/dashboard/pqrs/nueva" className={styles.btnPrimaryFull}>Apelar suspensión (PQRS)</Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
