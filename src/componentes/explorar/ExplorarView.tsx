'use client';
import { useState, useEffect } from 'react';
import PropertyCard from '@/componentes/ui/PropertyCard/PropertyCard';
import ExplorarMap from '@/componentes/explorar/ExplorarMap/ExplorarMap';
import TopSearchBar from '@/componentes/explorar/TopSearchBar/TopSearchBar';
import ExplorarFilters from '@/componentes/explorar/ExplorarFilters/ExplorarFilters';
import { calcularPromedioResenas } from '@/lib/resenas/utils';
import styles from '@/app/explorar/page.module.css';

export default function ExplorarView({ propiedades, favoritosIds, favoritosDeshabilitados, q, useSemantic, vistaInicial = 'lista', page, params }: any) {
  const [vista, setVista] = useState(vistaInicial);
  const [showBanner, setShowBanner] = useState(!!(useSemantic && propiedades?.length));
  useEffect(() => {
    if (!showBanner) return;
    const t = setTimeout(() => setShowBanner(false), 3000);
    return () => clearTimeout(t);
  }, [q, showBanner]);
  useEffect(() => { if (useSemantic && propiedades?.length) setShowBanner(true); }, [q]);
  return (
    <>
      <TopSearchBar vista={vista} onVistaChange={setVista} />
      {showBanner && (
        <div style={{ margin: '1rem 0', padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: '0.9rem', color: '#15803d' }}>
          ✨ De acuerdo a tu búsqueda <strong>“{q}”</strong> te recomendamos primero las más parecidas a lo que necesitas.
        </div>
      )}
      <div className={styles.layout}>
        <div className={styles.mainContent}>
          {vista === 'mapa' ? <ExplorarMap propiedades={propiedades} destacadaId={useSemantic ? propiedades[0]?.id : undefined} /> : (
            <>
              <div className={styles.grid}>
                {propiedades.map((prop: any, idx: number) => {
                  const anfitrion = prop.anfitrion;
                  const fotos = prop.propiedades_fotos;
                  const imagenPrincipal = fotos?.[0]?.url;
                  const servicios = prop.servicios_rel?.map((s: any) => s.servicio) || [];
                  const resumenResenas = calcularPromedioResenas(prop.resenas);
                  const isTop = useSemantic && idx === 0 && propiedades.length > 1;
                  return (
                    <div key={prop.id} style={isTop ? { position: 'relative', outline: '2px solid #16a34a', borderRadius: 16, padding: 2 } : undefined}>
                      {isTop && <div style={{ position: 'absolute', top: -10, left: 12, zIndex: 3, background: '#16a34a', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', borderRadius: 20 }}>⭐ Más compatible con tu búsqueda</div>}
                      <PropertyCard id={prop.id} titulo={prop.titulo} precio={prop.precio} ubicacion_texto={prop.ubicacion_texto} imagen_url={imagenPrincipal} vivienda_compartida={prop.vivienda_compartida} estado={prop.estado} prioridad={prop.prioridad} verificada={prop.verificada} perfil_arriendo={prop.perfil_arriendo} anfitrion_nombre={anfitrion?.nombre_completo} anfitrion_avatar={anfitrion?.avatar_url} servicios={servicios} isFavorite={favoritosIds.has(prop.id.toString())} favoritosDeshabilitados={favoritosDeshabilitados} calificacionPromedio={resumenResenas?.promedio ?? null} totalResenas={resumenResenas?.total ?? 0} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                {page > 1 && <a href={`?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`} className={styles.emptySub} style={{ padding: '0.6rem 1rem', border: '1px solid var(--color-border)', borderRadius: 8 }}>← Anterior</a>}
                {propiedades?.length === 12 && <a href={`?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`} className={styles.emptySub} style={{ padding: '0.6rem 1rem', border: '1px solid var(--color-border)', borderRadius: 8 }}>Siguiente →</a>}
              </div>
            </>
          )}
        </div>
        <aside className={styles.sidebar}><div className={styles.stickyWrapper}><ExplorarFilters /></div></aside>
      </div>
    </>
  );
}
