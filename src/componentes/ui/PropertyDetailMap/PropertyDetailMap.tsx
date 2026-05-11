'use client';

import dynamic from 'next/dynamic';

const PropertyDetailMapInner = dynamic(() => import('./PropertyDetailMapInner'), {
    ssr: false,
    loading: () => (
        <div style={{ 
            height: '280px', 
            background: '#f1f5f9', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#94a3b8',
            fontWeight: 600 
        }}>
            Cargando mapa...
        </div>
    )
});

interface PropertyDetailMapProps {
    lat: number;
    lng: number;
    direccion: string;
}

export default function PropertyDetailMap({ lat, lng, direccion }: PropertyDetailMapProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <PropertyDetailMapInner lat={lat} lng={lng} />
            <p style={{ 
                fontSize: '0.85rem', 
                color: 'var(--color-text-muted)', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
            }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                La ubicación es aproximada para proteger la privacidad del anfitrión. La dirección exacta se comparte al confirmar visita.
            </p>
        </div>
    );
}
