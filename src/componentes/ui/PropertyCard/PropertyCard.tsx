import styles from './PropertyCard.module.css';

interface PropertyProps {
    titulo: string;
    precio: number;
    ubicacion: string;
    imagen_url?: string;
    // Incorporar después
    // anfitrion?: {nombre: string; avatar: string; verificado: boolean};
    // estado?: 'Disponible' | 'Ocupado';
    // calificacion?: number;
    // caracteristicas?: string[]; // wifi, parqueadero, aire...
}

export default function PropertyCard({ titulo, precio, ubicacion, imagen_url }: PropertyProps) {
    // Función para formato de precio
    const formatPrecio = (valor: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(valor);
    };

    return (
        <div className={styles.card}>

            <div className={styles.header}>
                {/* Avatar, nombre, verificación e icono favorito */}
            </div>

            <div className={styles.imageContainer}>
                {imagen_url ? (
                    <img src={imagen_url} alt={titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <span>Sin imagen</span>
                )}
            </div>

            <div className={styles.content}>
                <p className={styles.price}>{formatPrecio(precio)}</p>
                <h3 className={styles.title}>{titulo}</h3>
                <p className={styles.location}>📍 {ubicacion}</p>
            </div>

            <div className={styles.footer}>
                <button className={styles.viewButton}>Ver detalles</button>
            </div>
        </div>
    );
}