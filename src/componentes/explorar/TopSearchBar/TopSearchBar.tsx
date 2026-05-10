'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import styles from './TopSearchBar.module.css';

export default function TopSearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [q, setQ] = useState(searchParams.get('q') || '');
    const [isPending, startTransition] = useTransition();

    const vistaActual = searchParams.get('vista') || 'lista';

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        actualizarUrl({ q: q || null });
    };

    const cambiarVista = (nuevaVista: string) => {
        actualizarUrl({ vista: nuevaVista });
    };

    const actualizarUrl = (cambios: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        
        Object.entries(cambios).forEach(([key, value]) => {
            if (value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        
        startTransition(() => {
            router.push(`/explorar?${params.toString()}`);
        });
    };

    return (
        <div className={styles.topSection}>
            <form className={styles.searchForm} onSubmit={handleSearch}>
                <div className={styles.inputWrapper}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Buscador Inteligente: Escribe una zona, nombre o tipo de lugar (Ej: Habitaciones cerca a Unipaz)"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className={styles.searchInput}
                    />
                    <button type="submit" className={styles.searchButton} disabled={isPending}>
                        {isPending ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>
            </form>

            <div className={styles.viewToggle}>
                <button 
                    type="button"
                    className={`${styles.toggleBtn} ${vistaActual === 'lista' ? styles.active : ''}`}
                    onClick={() => cambiarVista('lista')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    Lista
                </button>
                <button 
                    type="button"
                    className={`${styles.toggleBtn} ${vistaActual === 'mapa' ? styles.active : ''}`}
                    onClick={() => cambiarVista('mapa')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
                    Mapa
                </button>
            </div>
        </div>
    );
}
