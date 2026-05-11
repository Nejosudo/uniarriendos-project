'use client';

import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
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

    return (
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
            <Marker position={position} />
        </MapContainer>
    );
}
