'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
            // Simplificar dirección
            const road = data.address.road || data.address.pedestrian || '';
            const neighbourhood = data.address.neighbourhood || data.address.suburb || '';
            const city = data.address.city || data.address.town || '';
            
            let parts = [];
            if (road) parts.push(road);
            if (neighbourhood) parts.push(`Barrio ${neighbourhood}`);
            if (city) parts.push(city);
            
            if (parts.length > 0) {
                return parts.join(', ');
            } else {
                return data.display_name;
            }
        }
        return undefined;
    } catch (e) {
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

    return (
        <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', zIndex: 1 }}>
            <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={center} onChange={onLocationChange} />
            </MapContainer>
        </div>
    );
}
