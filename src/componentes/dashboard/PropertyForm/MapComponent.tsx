'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CotsemLayers from '@/componentes/ui/CotsemLayers/CotsemLayers';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapComponentProps {
    lat: number;
    lng: number;
    onLocationChange: (lat: number, lng: number, address?: string) => void;
}

// Unipaz coords as default center: approx 7.0687, -73.8427
const UNIPAZ_CENTER: [number, number] = [7.0687, -73.8427];

const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await res.json();
        
        if (data && data.address) {
            // Construir dirección completa con número de propiedad
            const houseNumber = data.address.house_number || '';
            const road = data.address.road || data.address.pedestrian || '';
            const neighbourhood = data.address.neighbourhood || data.address.suburb || '';
            const city = data.address.city || data.address.town || '';
        
            
            let parts = [];
        
            if (road && houseNumber) {
                parts.push(`${road} #${houseNumber}`);
            } else if (road) {
                parts.push(road);
            }
            
            if (neighbourhood) parts.push(`Barrio ${neighbourhood}`);
            if (city) parts.push(city);
            
            const resultado = parts.length > 0 ? parts.join(', ') : data.display_name;
            return resultado;
        }
        return undefined;
    } catch (e) {
        console.error('❌ Error en getAddressFromCoords:', e);
        return undefined;
    }
};

function LocationMarker({ position, onChange }: { position: L.LatLngExpression, onChange: (lat: number, lng: number, address?: string) => void }) {
    const markerRef = useRef<L.Marker>(null);

    useMapEvents({
        async click(e) {
            const addr = await getAddressFromCoords(e.latlng.lat, e.latlng.lng);
            onChange(e.latlng.lat, e.latlng.lng, addr);
        },
    });

    return position ? (
        <Marker
            draggable={true}
            eventHandlers={{
                dragend: async () => {
                    const marker = markerRef.current;
                    if (marker != null) {
                        const { lat, lng } = marker.getLatLng();
                        const addr = await getAddressFromCoords(lat, lng);
                        onChange(lat, lng, addr);
                    }
                },
            }}
            position={position}
            ref={markerRef}
        />
    ) : null;
}

export default function MapComponent({ lat, lng, onLocationChange }: MapComponentProps) {
    const center: [number, number] = lat && lng ? [lat, lng] : UNIPAZ_CENTER;
    const [showRuta, setShowRuta] = useState(true);
    const [showParadas, setShowParadas] = useState(true);

    return (
        <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', zIndex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 500, background: 'white', padding: '6px 10px', borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.15)', fontSize: '0.8rem', display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={showRuta} onChange={e => setShowRuta(e.target.checked)} /> Ruta</label>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={showParadas} onChange={e => setShowParadas(e.target.checked)} /> Paradas</label>
            </div>
            <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <CotsemLayers showRuta={showRuta} showParadas={showParadas} />
                <LocationMarker position={center} onChange={onLocationChange} />
            </MapContainer>
        </div>
    );
}
