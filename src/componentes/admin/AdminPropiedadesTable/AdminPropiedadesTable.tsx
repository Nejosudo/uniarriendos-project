'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    adminCambiarEstadoPropiedad,
    adminCambiarPrioridad,
    adminToggleVerificada,
} from '@/app/acciones/adminPropiedadesActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './AdminPropiedadesTable.module.css';

interface AdminPropiedadesTableProps {
    propiedades: any[];
}

export default function AdminPropiedadesTable({ propiedades: initial }: AdminPropiedadesTableProps) {
    const [propiedades, setPropiedades] = useState(initial);
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [busqueda, setBusqueda] = useState('');

    const filtradas = propiedades.filter((p) => {
        const q = busqueda.toLowerCase();
        return (
            p.titulo?.toLowerCase().includes(q) ||
            p.ubicacion_texto?.toLowerCase().includes(q) ||
            p.propietario?.nombre_completo?.toLowerCase().includes(q)
        );
    });

    const updateProp = (id: number, patch: Record<string, unknown>) => {
        setPropiedades(propiedades.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    };

    const handleEstado = async (id: number, estado: string) => {
        setLoadingId(id);
        const result = await adminCambiarEstadoPropiedad(id, estado);
        if (result.success) updateProp(id, { estado });
        else alert(result.error);
        setLoadingId(null);
    };

    const handlePrioridad = async (id: number, prioridad: string) => {
        setLoadingId(id);
        const result = await adminCambiarPrioridad(id, prioridad);
        if (result.success) updateProp(id, { prioridad });
        else alert(result.error);
        setLoadingId(null);
    };

    const handleVerificada = async (id: number, verificada: boolean) => {
        setLoadingId(id);
        const result = await adminToggleVerificada(id, verificada);
        if (result.success) updateProp(id, { verificada });
        else alert(result.error);
        setLoadingId(null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <DynamicIcon name="Search" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar propiedad o anfitrión..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <span className={styles.count}>{filtradas.length} propiedades</span>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Propiedad</th>
                            <th>Anfitrión</th>
                            <th>Precio</th>
                            <th>Estado</th>
                            <th>Prioridad</th>
                            <th>Verificada</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtradas.map((prop) => {
                            const fotos = prop.propiedades_fotos || [];
                            const imgUrl = fotos.length > 0 ? fotos[0].url : null;
                            const anfitrion = prop.propietario;

                            return (
                                <tr key={prop.id} className={loadingId === prop.id ? styles.rowLoading : ''}>
                                    <td>
                                        <div className={styles.propInfo}>
                                            <div className={styles.imgWrapper}>
                                                {imgUrl ? (
                                                    <img src={imgUrl} alt={prop.titulo} />
                                                ) : (
                                                    <div className={styles.imgPlaceholder}>
                                                        <DynamicIcon name="Image" size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <strong>{prop.titulo}</strong>
                                                <span className={styles.location}>{prop.ubicacion_texto}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{anfitrion?.nombre_completo || '—'}</td>
                                    <td>${prop.precio?.toLocaleString('es-CO')}</td>
                                    <td>
                                        <select
                                            value={prop.estado}
                                            onChange={(e) => handleEstado(prop.id, e.target.value)}
                                            disabled={loadingId === prop.id}
                                            className={styles.select}
                                        >
                                            <option value="disponible">Disponible</option>
                                            <option value="ocupado">Ocupado</option>
                                            <option value="inactivo">Oculto</option>
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            value={prop.prioridad || 'comun'}
                                            onChange={(e) => handlePrioridad(prop.id, e.target.value)}
                                            disabled={loadingId === prop.id}
                                            className={styles.select}
                                        >
                                            <option value="comun">Común</option>
                                            <option value="recomendada">Destacada</option>
                                        </select>
                                    </td>
                                    <td>
                                        <label className={styles.checkLabel}>
                                            <input
                                                type="checkbox"
                                                checked={!!prop.verificada}
                                                onChange={(e) => handleVerificada(prop.id, e.target.checked)}
                                                disabled={loadingId === prop.id}
                                            />
                                            {prop.verificada ? 'Sí' : 'No'}
                                        </label>
                                    </td>
                                    <td>
                                        <Link
                                            href={`/propiedades/${prop.id}`}
                                            target="_blank"
                                            className={styles.viewBtn}
                                            title="Ver pública"
                                        >
                                            <DynamicIcon name="ExternalLink" size={18} />
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filtradas.length === 0 && (
                    <p className={styles.empty}>No se encontraron propiedades.</p>
                )}
            </div>
        </div>
    );
}
