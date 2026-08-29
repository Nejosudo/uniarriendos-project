'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styles from './ExplorarMap.module.css';
import Link from 'next/link';
import NextImage from 'next/image';

// Configuración para corregir los iconos de Leaflet en Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapComponent({ propiedades }: { propiedades: any[] }) {
    // Centro aproximado de Barrancabermeja
    const center: [number, number] = [7.0653, -73.8547]; 

    return (
        <div className={styles.mapContainer}>
            <MapContainer center={center} zoom={13} scrollWheelZoom={true} className={styles.map}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {propiedades.map((prop, idx) => {
                    // Usar coordenadas reales, si no existen, no renderizar el marcador
                    if (!prop.ubicacion_lat || !prop.ubicacion_lng) return null;

                    const lat = prop.ubicacion_lat;
                    const lng = prop.ubicacion_lng;
                    
                    const formatPrecio = (valor: number) => {
                        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
                    };
                    
                    return (
                        <Marker key={prop.id} position={[lat, lng]} icon={icon}>
                            <Popup className={styles.customPopup}>
                                <div className={styles.popupContent}>
                                    {prop.propiedades_fotos && prop.propiedades_fotos[0] && (
                                        <NextImage src={prop.propiedades_fotos[0].url} alt={prop.titulo} width={200} height={120} className={styles.popupImg} style={{ objectFit: 'cover' }} />
                                    )}
                                    <div className={styles.popupInfo}>
                                        <h3 className={styles.popupTitle}>{prop.titulo}</h3>
                                        <p className={styles.popupPrice}>
                                            {formatPrecio(prop.precio)}
                                            {prop.verificada && (
                                                <span style={{ marginLeft: '6px', color: '#16a34a', fontWeight: 'bold', fontSize: '0.8rem' }} title="Propiedad verificada por admin">
                                                    ✓ Verificada
                                                </span>
                                            )}
                                        </p>
                                        <Link href={`/propiedades/${prop.id}`} className={styles.popupBtn}>
                                            Ver detalle
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
