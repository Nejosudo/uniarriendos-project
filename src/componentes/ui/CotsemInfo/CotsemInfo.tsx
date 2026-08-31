'use client';
import { useEffect, useState } from 'react';
function haversine(lat1:number,lng1:number,lat2:number,lng2:number){const R=6371;const dLat=(lat2-lat1)*Math.PI/180;const dLng=(lng2-lng1)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(a));}
export default function CotsemInfo({ lat, lng }: { lat:number; lng:number }) {
  const [info,setInfo]=useState<{nombre:string;dist:number;min:number}|null>(null);
  useEffect(()=>{fetch('/api/cotsem/routes').then(r=>r.json()).then(d=>{
    let best:any=null;let bestDist=Infinity;
    for(const p of d.paradas){const dist=haversine(lat,lng,p.lat,p.lng);if(dist<bestDist){bestDist=dist;best=p;}}
    if(best){setInfo({nombre:best.nombre,dist:bestDist,min:Math.round(bestDist*12)});}
  }).catch(()=>{});},[lat,lng]);
  if(!info) return null;
  return <div style={{ margin: '0.6rem 0 0.8rem', padding: '0.6rem 0.8rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ fontSize: '1.1rem' }}>🚌</span><span><strong>Parada más cercana:</strong> {info.nombre} — {(info.dist*1000).toFixed(0)}m · ~{info.min} min a pie</span></div>;
}
