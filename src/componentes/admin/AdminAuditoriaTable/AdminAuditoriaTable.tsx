'use client';

import { useMemo, useState } from 'react';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './AdminAuditoriaTable.module.css';

interface RegistroAuditoria {
    id: number;
    admin_id: string;
    accion: string;
    entidad: string;
    entidad_id: string | null;
    detalle: unknown;
    created_at: string;
    admin?: { nombre_completo: string | null } | null;
}

interface AdminAuditoriaTableProps {
    registros: RegistroAuditoria[];
}

const POR_PAGINA = 20;

const ACCIONES: Record<string, string> = {
    cambiar_rol_usuario: 'Cambió un rol de usuario',
    suspender_usuario: 'Suspendió un usuario',
    levantar_suspension: 'Levantó una suspensión',
    cambiar_estado_propiedad: 'Cambió estado de propiedad',
    cambiar_prioridad_propiedad: 'Cambió prioridad de propiedad',
    verificar_propiedad: 'Actualizó verificación',
    responder_pqrs: 'Respondió PQRS',
    cambiar_estado_pqrs: 'Cambió estado de PQRS',
    aprobar_resena: 'Aprobó reseña',
    ocultar_resena: 'Ocultó reseña',
    eliminar_resena: 'Eliminó reseña',
    revisar_foto: 'Revisó foto',
};

function formatFecha(value: string) {
    return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

function resumenDetalle(detalle: unknown) {
    if (detalle === null || detalle === undefined) return '—';
    try {
        const texto = JSON.stringify(detalle);
        return texto.length > 160 ? `${texto.slice(0, 157)}...` : texto;
    } catch {
        return '—';
    }
}

export default function AdminAuditoriaTable({ registros }: AdminAuditoriaTableProps) {
    const [busqueda, setBusqueda] = useState('');
    const [accion, setAccion] = useState('todas');
    const [entidad, setEntidad] = useState('todas');
    const [pagina, setPagina] = useState(1);

    const acciones = useMemo(
        () => Array.from(new Set(registros.map((registro) => registro.accion))).sort(),
        [registros]
    );
    const entidades = useMemo(
        () => Array.from(new Set(registros.map((registro) => registro.entidad))).sort(),
        [registros]
    );

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return registros.filter((registro) => {
            if (accion !== 'todas' && registro.accion !== accion) return false;
            if (entidad !== 'todas' && registro.entidad !== entidad) return false;
            if (!q) return true;
            return (
                registro.admin?.nombre_completo?.toLowerCase().includes(q) ||
                registro.accion.toLowerCase().includes(q) ||
                registro.entidad.toLowerCase().includes(q) ||
                registro.entidad_id?.toLowerCase().includes(q) ||
                resumenDetalle(registro.detalle).toLowerCase().includes(q)
            );
        });
    }, [registros, busqueda, accion, entidad]);

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const visibles = filtrados.slice(
        (paginaActual - 1) * POR_PAGINA,
        paginaActual * POR_PAGINA
    );

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <DynamicIcon name="Search" size={18} />
                    <input
                        type="search"
                        placeholder="Buscar por administrador, entidad o detalle..."
                        value={busqueda}
                        onChange={(event) => {
                            setBusqueda(event.target.value);
                            setPagina(1);
                        }}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.filters}>
                    <select
                        value={accion}
                        onChange={(event) => {
                            setAccion(event.target.value);
                            setPagina(1);
                        }}
                        className={styles.select}
                    >
                        <option value="todas">Todas las acciones</option>
                        {acciones.map((value) => (
                            <option key={value} value={value}>{ACCIONES[value] || value}</option>
                        ))}
                    </select>
                    <select
                        value={entidad}
                        onChange={(event) => {
                            setEntidad(event.target.value);
                            setPagina(1);
                        }}
                        className={styles.select}
                    >
                        <option value="todas">Todas las entidades</option>
                        {entidades.map((value) => (
                            <option key={value} value={value}>{value}</option>
                        ))}
                    </select>
                    <span className={styles.count}>{filtrados.length} registros</span>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Administrador</th>
                            <th>Acción</th>
                            <th>Entidad</th>
                            <th>Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.map((registro) => (
                            <tr key={registro.id}>
                                <td className={styles.dateCell}>{formatFecha(registro.created_at)}</td>
                                <td>{registro.admin?.nombre_completo || 'Administrador'}</td>
                                <td>{ACCIONES[registro.accion] || registro.accion.replaceAll('_', ' ')}</td>
                                <td>
                                    <span className={styles.entity}>{registro.entidad}</span>
                                    {registro.entidad_id && (
                                        <code className={styles.entityId}>{registro.entidad_id}</code>
                                    )}
                                </td>
                                <td>
                                    <code className={styles.detail} title={resumenDetalle(registro.detalle)}>
                                        {resumenDetalle(registro.detalle)}
                                    </code>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtrados.length === 0 && (
                    <p className={styles.empty}>No hay registros de auditoría para este filtro.</p>
                )}
            </div>

            {totalPaginas > 1 && (
                <div className={styles.pagination}>
                    <button
                        type="button"
                        onClick={() => setPagina((value) => Math.max(1, value - 1))}
                        disabled={paginaActual === 1}
                    >
                        Anterior
                    </button>
                    <span>Página {paginaActual} de {totalPaginas}</span>
                    <button
                        type="button"
                        onClick={() => setPagina((value) => Math.min(totalPaginas, value + 1))}
                        disabled={paginaActual === totalPaginas}
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
}
