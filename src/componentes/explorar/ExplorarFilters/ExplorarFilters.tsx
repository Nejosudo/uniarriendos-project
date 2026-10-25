'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './ExplorarFilters.module.css';

interface Servicio {
    id: number;
    nombre: string;
    icono: string | null;
}

interface ExplorarFiltersProps {
    serviciosDisponibles: Servicio[];
}

const RANGOS_PRECIO = [
    { value: '', label: 'Cualquier precio' },
    { value: '0-300000', label: 'Hasta $300.000' },
    { value: '300000-500000', label: '$300.000 - $500.000' },
    { value: '500000-800000', label: '$500.000 - $800.000' },
    { value: '800000-1200000', label: '$800.000 - $1.200.000' },
    { value: '1200000-9999999', label: 'Más de $1.200.000' },
];

export default function ExplorarFilters({ serviciosDisponibles }: ExplorarFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const compartidaParam = searchParams.get('compartida');
    const [precioRango, setPrecioRango] = useState(searchParams.get('precio_rango') || '');
    const [tipoEspacio, setTipoEspacio] = useState(
        compartidaParam === 'true' ? 'compartida' : compartidaParam === 'false' ? 'completa' : ''
    );
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState<number[]>(() => {
        const raw = searchParams.get('servicios') || '';
        return [...new Set(raw.split(',').map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    });
    const [soloVerificadas, setSoloVerificadas] = useState(searchParams.get('verificada') === 'true');

    const filtrosActivos =
        (precioRango ? 1 : 0) +
        (tipoEspacio ? 1 : 0) +
        serviciosSeleccionados.length +
        (soloVerificadas ? 1 : 0);

    const toggleServicio = (id: number) => {
        setServiciosSeleccionados((prev) =>
            prev.includes(id) ? prev.filter((servicioId) => servicioId !== id) : [...prev, id]
        );
    };

    const aplicarFiltros = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (precioRango) params.set('precio_rango', precioRango);
        else params.delete('precio_rango');

        if (tipoEspacio === 'compartida') params.set('compartida', 'true');
        else if (tipoEspacio === 'completa') params.set('compartida', 'false');
        else params.delete('compartida');

        if (serviciosSeleccionados.length > 0) {
            params.set('servicios', [...serviciosSeleccionados].sort((a, b) => a - b).join(','));
        } else {
            params.delete('servicios');
        }

        if (soloVerificadas) params.set('verificada', 'true');
        else params.delete('verificada');

        params.delete('page');

        const query = params.toString();
        startTransition(() => {
            router.push(query ? `/explorar?${query}` : '/explorar');
        });
    };

    const limpiarFiltros = () => {
        setPrecioRango('');
        setTipoEspacio('');
        setServiciosSeleccionados([]);
        setSoloVerificadas(false);

        const params = new URLSearchParams(searchParams.toString());
        ['precio_rango', 'tipo', 'compartida', 'servicios', 'verificada', 'page'].forEach((key) =>
            params.delete(key)
        );

        const query = params.toString();
        startTransition(() => {
            router.push(query ? `/explorar?${query}` : '/explorar');
        });
    };

    return (
        <div className={styles.filtersContainer} style={{ opacity: isPending ? 0.75 : 1 }}>
            <div className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>Refina tu búsqueda</span>
                    <h2 className={styles.title}>Filtros</h2>
                </div>
                {filtrosActivos > 0 && (
                    <span className={styles.activeBadge}>
                        {filtrosActivos} activo{filtrosActivos === 1 ? '' : 's'}
                    </span>
                )}
            </div>

            <div className={styles.filterGroup}>
                <label className={styles.label} htmlFor="precio-rango">Precio mensual</label>
                <div className={styles.selectWrapper}>
                    <select
                        id="precio-rango"
                        value={precioRango}
                        onChange={(e) => setPrecioRango(e.target.value)}
                        className={styles.select}
                    >
                        {RANGOS_PRECIO.map((rango) => (
                            <option key={rango.value} value={rango.value}>{rango.label}</option>
                        ))}
                    </select>
                    <DynamicIcon name="ChevronDown" size={16} className={styles.selectIcon} />
                </div>
            </div>

            <div className={styles.filterGroup}>
                <span className={styles.label}>Tipo de espacio</span>
                <div className={styles.segmented} role="group" aria-label="Tipo de espacio">
                    {[
                        { value: '', label: 'Todas' },
                        { value: 'completa', label: 'Completa' },
                        { value: 'compartida', label: 'Compartida' },
                    ].map((opcion) => (
                        <button
                            key={opcion.value}
                            type="button"
                            className={`${styles.segment} ${tipoEspacio === opcion.value ? styles.segmentActive : ''}`}
                            aria-pressed={tipoEspacio === opcion.value}
                            onClick={() => setTipoEspacio(opcion.value)}
                        >
                            {opcion.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.filterGroup}>
                <div className={styles.labelRow}>
                    <span className={styles.label}>Servicios y comodidades</span>
                    {serviciosSeleccionados.length > 0 && (
                        <span className={styles.groupCount}>{serviciosSeleccionados.length}</span>
                    )}
                </div>
                <div className={styles.servicesGrid}>
                    {serviciosDisponibles.map((servicio) => {
                        const selected = serviciosSeleccionados.includes(servicio.id);
                        return (
                            <label
                                key={servicio.id}
                                className={`${styles.serviceOption} ${selected ? styles.serviceOptionSelected : ''}`}
                                title={servicio.nombre}
                            >
                                <input
                                    type="checkbox"
                                    className={styles.serviceCheckbox}
                                    checked={selected}
                                    onChange={() => toggleServicio(servicio.id)}
                                />
                                <span className={styles.serviceIcon} aria-hidden="true">
                                    <DynamicIcon name={servicio.icono || 'CheckCircle'} size={15} />
                                </span>
                                <span className={styles.serviceName}>{servicio.nombre}</span>
                                {selected && (
                                    <span className={styles.serviceCheck} aria-hidden="true">
                                        <DynamicIcon name="Check" size={13} />
                                    </span>
                                )}
                            </label>
                        );
                    })}
                </div>
            </div>

            <label className={styles.verifiedOption}>
                <input
                    type="checkbox"
                    checked={soloVerificadas}
                    onChange={(e) => setSoloVerificadas(e.target.checked)}
                />
                <span className={styles.switch} aria-hidden="true" />
                <span className={styles.verifiedText}>
                    <strong>Solo verificadas</strong>
                    <small>Revisadas por UniArriendos</small>
                </span>
            </label>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.btnApply}
                    onClick={aplicarFiltros}
                    disabled={isPending}
                    aria-busy={isPending}
                >
                    {isPending ? 'Aplicando...' : 'Aplicar filtros'}
                </button>
                <button type="button" className={styles.btnClear} onClick={limpiarFiltros} disabled={isPending}>
                    Limpiar filtros
                </button>
            </div>
        </div>
    );
}
