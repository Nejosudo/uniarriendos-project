'use client';
import dynamic from 'next/dynamic';

// Cargar dinámicamente el componente del mapa para evitar errores de "window is not defined"
const MapComponent = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => (
        <div style={{ height: '600px', background: '#e2e8f0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            Cargando mapa interactivo...
        </div>
    )
});

export default function ExplorarMap({ propiedades }: { propiedades: any[] }) {
    return <MapComponent propiedades={propiedades} />;
}
