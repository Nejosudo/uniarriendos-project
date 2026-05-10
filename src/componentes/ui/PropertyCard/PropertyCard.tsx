import Link from 'next/link';
import styles from './PropertyCard.module.css';
import DynamicIcon from '@/componentes/ui/DynamicIcon';

interface PropertyProps {
    id: number;
    titulo: string;
    precio: number;
    ubicacion_texto: string;
    imagen_url?: string;
    vivienda_compartida?: boolean;
    estado?: string;
    prioridad?: string;
    perfil_arriendo?: string;
    anfitrion_nombre?: string;
    anfitrion_avatar?: string;
    servicios?: any[];
}

export default function PropertyCard(props: PropertyProps) {
    const {
        id, titulo, precio, ubicacion_texto, imagen_url, 
        vivienda_compartida, estado, prioridad, perfil_arriendo, anfitrion_nombre, anfitrion_avatar, servicios
    } = props;

    const formatPrecio = (valor: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(valor);
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.hostInfo}>
                    {anfitrion_avatar ? (
                        <img src={anfitrion_avatar} alt={anfitrion_nombre} className={styles.hostAvatar} />
                    ) : (
                        <div className={styles.defaultHostAvatar}>
                            {anfitrion_nombre ? anfitrion_nombre.charAt(0).toUpperCase() : 'H'}
                        </div>
                    )}
                    <span className={styles.hostName}>{anfitrion_nombre || 'Anfitrión'}</span>
                </div>
            </div>

            <div className={styles.imageWrapper}>
                {imagen_url ? (
                    <img src={imagen_url} alt={titulo} className={styles.image} />
                ) : (
                    <div className={styles.noImage}>Sin Imagen</div>
                )}
                
                <div className={styles.badges}>
                    {estado === 'disponible' && <span className={styles.badgeSuccess}>Disponible</span>}
                    {estado === 'ocupado' && <span className={styles.badgeError}>Ocupado</span>}
                    {prioridad === 'verificada' && <span className={styles.badgeVerified}>✓ Verificada</span>}
                    {prioridad === 'recomendada' && <span className={styles.badgeRecommended}>★ Recomendada</span>}
                </div>

                <button className={styles.favoriteBtn} aria-label="Añadir a favoritos">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>

            <div className={styles.content}>
                <div className={styles.priceRow}>
                    <p className={styles.price}>{formatPrecio(precio)}<span className={styles.pricePerMonth}>/mes</span></p>
                </div>
                
                <h3 className={styles.title}>{titulo}</h3>
                <p className={styles.location}>
                    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {ubicacion_texto}
                </p>

                <div className={styles.tags}>
                    {vivienda_compartida && <span className={styles.tag}>Compartida</span>}
                    {perfil_arriendo && perfil_arriendo !== 'ambos' && (
                        <span className={styles.tag}>Solo {perfil_arriendo}</span>
                    )}
                </div>

                {servicios && servicios.length > 0 && (
                    <div className={styles.servicesRow}>
                        {servicios.slice(0, 3).map((srv, idx) => (
                            <span key={idx} className={styles.serviceIconTag} title={srv.nombre}>
                                <DynamicIcon name={srv.icono} size={14} color="var(--color-text-muted)" />
                                {srv.nombre}
                            </span>
                        ))}
                        {servicios.length > 3 && (
                            <span className={styles.serviceIconTag} title={`Y ${servicios.length - 3} servicios más`}>
                                +{servicios.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.footer}>
                <Link href={`/propiedades/${id}`} className={styles.viewButton}>
                    Ver detalles
                </Link>
            </div>
        </div>
    );
}