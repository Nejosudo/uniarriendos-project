'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';

export default function CotsemLayers({ showRuta, showParadas }: { showRuta: boolean; showParadas: boolean }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/cotsem/routes').then(r => r.json()).then(setData).catch(()=>{}); }, []);
  if (!data) return null;
  const paradaIcon = L.divIcon({ html: '<div style="width:32px;height:42px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3))"><svg width="32" height="42" viewBox="0 0 32 42"><path d="M16 0 C9 0 4 5 4 12 C4 20 16 42 16 42 C16 42 28 20 28 12 C28 5 23 0 16 0 Z" fill="#15803d" stroke="white" stroke-width="2"/><g transform="translate(9,8)"><rect x="0" y="2" width="14" height="10" rx="2" fill="white"/><circle cx="4" cy="11" r="1.5" fill="#15803d"/><circle cx="10" cy="11" r="1.5" fill="#15803d"/><rect x="3" y="4" width="8" height="4" rx="1" fill="#15803d"/></g></svg></div>', iconSize: [10,22], iconAnchor: [6,32], className: '' });
  return (
    <>
      {showRuta && <Polyline positions={data.ruta} pathOptions={{ color: '#2563eb', weight: 7, opacity: 0.9 }} />}
      {showParadas && data.paradas.map((p: any, i: number) => (
        <Marker key={i} position={[p.lat, p.lng]} icon={paradaIcon}>
          <Popup>{p.nombre}</Popup>
        </Marker>
      ))}
    </>
  );
}
