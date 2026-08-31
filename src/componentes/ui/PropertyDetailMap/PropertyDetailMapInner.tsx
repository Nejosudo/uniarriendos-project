'use client';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import dynamic from 'next/dynamic';
const CotsemLayers = dynamic(() => import('@/componentes/ui/CotsemLayers/CotsemLayers'), { ssr: false, loading: () => null });
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PropertyDetailMapInnerProps {
    lat: number;
    lng: number;
}

export default function PropertyDetailMapInner({ lat, lng }: PropertyDetailMapInnerProps) {
    const position: [number, number] = [lat, lng];
    const [showRuta, setShowRuta] = useState(true);
    const [showParadas, setShowParadas] = useState(true);

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 500, background: 'white', padding: '6px 10px', borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.15)', fontSize: '0.8rem', display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={showRuta} onChange={e => setShowRuta(e.target.checked)} /> Ruta</label>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={showParadas} onChange={e => setShowParadas(e.target.checked)} /> Paradas</label>
            </div>
        <MapContainer 
            center={position} 
            zoom={16} 
            scrollWheelZoom={false} 
            style={{ height: '280px', width: '100%', borderRadius: '12px', zIndex: 1 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Círculo de zona aproximada para privacidad */}
            <Circle 
                center={position} 
                radius={80} 
                pathOptions={{ color: 'var(--color-primary)', fillColor: 'var(--color-primary)', fillOpacity: 0.15, weight: 2 }} 
            />
            <CotsemLayers showRuta={showRuta} showParadas={showParadas} />
            <Marker position={position} />
        </MapContainer>
        </div>
    );
}
