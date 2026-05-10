'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import styles from './ExplorarFilters.module.css';

export default function ExplorarFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Estados inicializados con los valores de la URL
    const [precioRango, setPrecioRango] = useState(searchParams.get('precio_rango') || '');
    const [tipo, setTipo] = useState(searchParams.get('tipo') || '');
    const [compartida, setCompartida] = useState(searchParams.get('compartida') === 'true');

    const aplicarFiltros = () => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (precioRango) params.set('precio_rango', precioRango);
        else params.delete('precio_rango');
        
        if (tipo) params.set('tipo', tipo);
        else params.delete('tipo');
        
        if (compartida) params.set('compartida', 'true');
        else params.delete('compartida');
        
        startTransition(() => {
            router.push(`/explorar?${params.toString()}`);
        });
    };

    const limpiarFiltros = () => {
        setPrecioRango('');
        setTipo('');
        setCompartida(false);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('precio_rango');
        params.delete('tipo');
        params.delete('compartida');
        
        startTransition(() => {
            router.push(`/explorar?${params.toString()}`);
        });
    };

    return (
        <div className={styles.filtersContainer} style={{ opacity: isPending ? 0.7 : 1 }}>
            <h2 className={styles.title}>Filtros</h2>

            <div className={styles.filterGroup}>
                <label className={styles.label}>Rango de Precio</label>
                <select 
                    value={precioRango} 
                    onChange={(e) => setPrecioRango(e.target.value)} 
                    className={styles.select}
                >
                    <option value="">Cualquier precio</option>
                    <option value="0-300000">Menos de $300.000</option>
                    <option value="300000-500000">$300.000 - $500.000</option>
                    <option value="500000-800000">$500.000 - $800.000</option>
                    <option value="800000-1200000">$800.000 - $1.200.000</option>
                    <option value="1200000-9999999">Más de $1.200.000</option>
                </select>
            </div>

            <div className={styles.filterGroup}>
                <label className={styles.label}>Perfil Permitido</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={styles.select}>
                    <option value="">Cualquiera</option>
                    <option value="estudiante">Solo Estudiantes (Unipaz)</option>
                    <option value="externo">Solo Externos</option>
                </select>
            </div>

            <div className={styles.checkboxGroup}>
                <input 
                    type="checkbox" 
                    id="compartida" 
                    checked={compartida}
                    onChange={(e) => setCompartida(e.target.checked)}
                    className={styles.checkbox}
                />
                <label htmlFor="compartida" className={styles.checkboxLabel}>Vivienda Compartida (Roomie)</label>
            </div>

            <div className={styles.actions}>
                <button type="button" className={styles.btnApply} onClick={aplicarFiltros}>
                    {isPending ? 'Aplicando...' : 'Aplicar'}
                </button>
                <button type="button" className={styles.btnClear} onClick={limpiarFiltros}>Limpiar</button>
            </div>
        </div>
    );
}
