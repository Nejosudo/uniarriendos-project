'use client';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styles from './ExplorarMap.module.css';
import Link from 'next/link';
import NextImage from 'next/image';
import dynamic from 'next/dynamic';
const CotsemLayers = dynamic(() => import('@/componentes/ui/CotsemLayers/CotsemLayers'), { ssr: false, loading: () => null });

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
const iconDestacada = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapComponent({ propiedades, destacadaId }: { propiedades: any[]; destacadaId?: number }) {
    const [showRuta, setShowRuta] = useState(true);
    const [showParadas, setShowParadas] = useState(true);
    const center: [number, number] = [7.0653, -73.8547]; 

    return (
        <div className={styles.mapContainer}>
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 500, background: 'white', padding: '6px 10px', borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.15)', fontSize: '0.8rem', display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={showRuta} onChange={e => setShowRuta(e.target.checked)} /> Ruta COTSEM</label>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={showParadas} onChange={e => setShowParadas(e.target.checked)} /> Paradas</label>
            </div>
            <MapContainer center={center} zoom={13} scrollWheelZoom={true} className={styles.map}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <CotsemLayers showRuta={showRuta} showParadas={showParadas} />
                {propiedades.map((prop, idx) => {
                    // Usar coordenadas reales, si no existen, no renderizar el marcador
                    if (!prop.ubicacion_lat || !prop.ubicacion_lng) return null;

                    const lat = prop.ubicacion_lat;
                    const lng = prop.ubicacion_lng;
                    
                    const formatPrecio = (valor: number) => {
                        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
                    };
                    
                    const isDestacada = destacadaId === prop.id;
                    return (
                        <Marker key={prop.id} position={[lat, lng]} icon={isDestacada ? iconDestacada : icon}>
                            <Popup className={styles.customPopup}>
                                <div className={styles.popupContent}>
                                    {prop.propiedades_fotos && prop.propiedades_fotos[0] && (
                                        <NextImage src={prop.propiedades_fotos[0].url} alt={prop.titulo} width={200} height={120} className={styles.popupImg} style={{ objectFit: 'cover' }} />
                                    )}
                                    <div className={styles.popupInfo}>
                                        {isDestacada && <div style={{ background: '#16a34a', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '3px 6px', borderRadius: 10, marginBottom: 6, display: 'inline-block' }}>⭐ Más compatible</div>}
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
