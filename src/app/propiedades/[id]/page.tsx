import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import ImageGallery from './ImageGallery';
import Link from 'next/link';

export default async function PropiedadDetalle({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { id } = await params;

    // Obtener propiedad con relaciones
    const { data: propiedad, error } = await supabase
        .from('propiedades')
        .select(`
            *,
            anfitrion:perfiles!propiedades_propietario_id_fkey(nombre_completo, avatar_url, telefono, created_at),
            propiedades_fotos(url, orden),
            servicios_rel:propiedades_servicios(
                servicio:servicios(nombre, icono)
            )
        `)
        .eq('id', id)
        .single();

    if (error || !propiedad) {
        return notFound();
    }

    // Verificar si el usuario ha iniciado sesión
    const { data: { user } } = await supabase.auth.getUser();
    const isLoggedIn = !!user;

    // Normalizar datos
    const fotos = propiedad.propiedades_fotos?.sort((a: any, b: any) => a.orden - b.orden).map((f: any) => f.url) || [];
    const servicios = propiedad.servicios_rel?.map((s: any) => s.servicio) || [];
    const anfitrion = propiedad.anfitrion;

    const formatPrecio = (valor: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
    };

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{propiedad.titulo}</h1>
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
                                        ✓ {srv.nombre}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.emptyMsg}>No se especificaron servicios.</p>
                        )}
                    </section>

                    <section className={styles.section}>
                        <h2>Preguntas al Anfitrión</h2>
                        <div className={styles.qaContainer}>
                            <p className={styles.emptyMsg}>Aún no hay preguntas. ¡Sé el primero en preguntar!</p>
                            
                            {isLoggedIn ? (
                                <div className={styles.qaForm}>
                                    <textarea placeholder="Escribe tu pregunta aquí..." className={styles.textarea}></textarea>
                                    <button className={styles.btnPrimary}>Enviar Pregunta</button>
                                </div>
                            ) : (
                                <div className={styles.authPrompt}>
                                    <p>Para hacer una pregunta o reseña necesitas iniciar sesión.</p>
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

                            {isLoggedIn ? (
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
                                    <p>Inicia sesión para ver la información de contacto del anfitrión.</p>
                                    <Link href="/login" className={styles.btnPrimaryFull}>Iniciar Sesión</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
