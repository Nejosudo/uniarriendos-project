import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getRestriccionesUsuario } from '@/lib/suspensiones/guard';
import styles from './page.module.css';
import ImageGallery from './ImageGallery';
import ShareButton from '@/componentes/ui/ShareButton/ShareButton';
import FavoriteButton from '@/componentes/ui/FavoriteButton/FavoriteButton';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import PropertyDetailMap from '@/componentes/ui/PropertyDetailMap/PropertyDetailMap';
import Link from 'next/link';

export default async function PropiedadDetalle({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { id } = await params;

    // Obtener propiedad con relaciones, incluyendo reseñas
    const { data: propiedad, error } = await supabase
        .from('propiedades')
        .select(`
            *,
            anfitrion:perfiles!propiedades_propietario_id_fkey(nombre_completo, avatar_url, telefono, created_at),
            propiedades_fotos(url, orden),
            servicios_rel:propiedades_servicios(
                servicio:servicios(nombre, icono)
            ),
            resenas(
                *,
                usuario:perfiles(nombre_completo, avatar_url)
            )
        `)
        .eq('id', id)
        .single();

    if (error || !propiedad) {
        return notFound();
    }

    const { data: { user } } = await supabase.auth.getUser();
    const isLoggedIn = !!user;
    const restricciones = await getRestriccionesUsuario();
    const puedeVerContacto = isLoggedIn && restricciones.puedeVerContacto;
    const puedeUsarFavoritos = isLoggedIn && restricciones.puedeUsarFavoritos;
    const puedeInteractuar = isLoggedIn && restricciones.puedeInteractuarPublicaciones;

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
    const fotos = propiedad.propiedades_fotos?.sort((a: any, b: any) => a.orden - b.orden).map((f: any) => f.url) || [];
    const servicios = propiedad.servicios_rel?.map((s: any) => s.servicio) || [];
    const anfitrion = propiedad.anfitrion;
    const resenas = propiedad.resenas || [];

    const formatPrecio = (valor: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
    };

    return (
        <main className={styles.container}>
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
            </div>

            <ImageGallery fotos={fotos} />

            <div className={styles.contentGrid}>
                {/* Columna Izquierda: Información */}
                <div className={styles.mainInfo}>
                    <div className={styles.tagsRow}>
                        {propiedad.estado === 'disponible' && <span className={styles.tagSuccess}>Disponible</span>}
                        {propiedad.estado === 'ocupado' && <span className={styles.tagError}>Ocupado</span>}
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
                                {servicios.map((srv: any, idx: number) => (
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
                            <PropertyDetailMap 
                                lat={propiedad.ubicacion_lat} 
                                lng={propiedad.ubicacion_lng} 
                                direccion={propiedad.ubicacion_texto}
                            />
                        </section>
                    )}

                    {/* Sección de Reseñas */}
                    <section className={styles.section}>
                        <h2>Reseñas de otros usuarios</h2>
                        <div className={styles.reviewsContainer}>
                            {resenas.length > 0 ? (
                                <div className={styles.reviewsList}>
                                    {resenas.map((res: any) => (
                                        <div key={res.id} className={styles.reviewItem}>
                                            <div className={styles.reviewHeader}>
                                                {res.usuario?.avatar_url ? (
                                                    <img src={res.usuario.avatar_url} alt={res.usuario.nombre_completo} className={styles.reviewAvatar} />
                                                ) : (
                                                    <div className={styles.reviewAvatarDefault}>{res.usuario?.nombre_completo?.charAt(0)}</div>
                                                )}
                                                <div>
                                                    <p className={styles.reviewUser}>{res.usuario?.nombre_completo}</p>
                                                    <p className={styles.reviewDate}>{new Date(res.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className={styles.stars}>
                                                    {'★'.repeat(res.calificacion)}{'☆'.repeat(5 - res.calificacion)}
                                                </div>
                                            </div>
                                            <p className={styles.reviewComment}>{res.comentario}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.emptyMsg}>Aún no hay reseñas para esta propiedad.</p>
                            )}

                            {puedeInteractuar ? (
                                <div className={styles.addReview}>
                                    <h3>Añadir una reseña</h3>
                                    <textarea placeholder="Cuéntanos tu experiencia..." className={styles.textarea}></textarea>
                                    <button className={styles.btnPrimary}>Publicar Reseña</button>
                                </div>
                            ) : isLoggedIn ? (
                                <div className={styles.authPrompt}>
                                    <p>Tu cuenta está suspendida y no puedes dejar reseñas.</p>
                                    <Link href="/dashboard/pqrs/nueva" className={styles.btnOutline}>Apelar suspensión (PQRS)</Link>
                                </div>
                            ) : (
                                <div className={styles.authPrompt}>
                                    <p>Inicia sesión para dejar una reseña.</p>
                                    <Link href="/login" className={styles.btnOutline}>Iniciar Sesión</Link>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Sección de Preguntas */}
                    <section className={styles.section}>
                        <h2>Preguntas al Anfitrión</h2>
                        <div className={styles.qaContainer}>
                            <p className={styles.emptyMsg}>Aún no hay preguntas. ¡Sé el primero en preguntar!</p>
                            
                            {puedeInteractuar ? (
                                <div className={styles.qaForm}>
                                    <textarea placeholder="Escribe tu pregunta aquí..." className={styles.textarea}></textarea>
                                    <button className={styles.btnPrimary}>Enviar Pregunta</button>
                                </div>
                            ) : isLoggedIn ? (
                                <div className={styles.authPrompt}>
                                    <p>Tu cuenta está suspendida y no puedes enviar preguntas.</p>
                                    <Link href="/dashboard/pqrs/nueva" className={styles.btnOutline}>Apelar suspensión (PQRS)</Link>
                                </div>
                            ) : (
                                <div className={styles.authPrompt}>
                                    <p>Inicia sesión para hacer una pregunta.</p>
                                    <div className={styles.authButtons}>
                                        <Link href="/login" className={styles.btnOutline}>Iniciar Sesión</Link>
                                        <Link href="/registro" className={styles.btnPrimary}>Registrarse</Link>
                                    </div>
                                </div>
                            )}
                        </div>
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
                                    <img src={anfitrion.avatar_url} alt={anfitrion.nombre_completo} className={styles.hostAvatar} />
                                ) : (
                                    <div className={styles.defaultAvatar}>{anfitrion?.nombre_completo?.charAt(0).toUpperCase() || 'A'}</div>
                                )}
                                <div>
                                    <p className={styles.hostName}>{anfitrion?.nombre_completo || 'Anfitrión'}</p>
                                    <p className={styles.hostSubtitle}>Anfitrión verificado</p>
                                </div>
                            </div>

                            {puedeVerContacto ? (
                                <div className={styles.contactInfo}>
                                    <p className={styles.contactLabel}>Teléfono de contacto:</p>
                                    <p className={styles.contactPhone}>{anfitrion?.telefono || 'No proporcionado'}</p>
                                    {anfitrion?.telefono && (
                                        <a href={`https://wa.me/57${anfitrion.telefono}`} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp}>
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
