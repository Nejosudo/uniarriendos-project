'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PqrsEstado } from '@/app/acciones/pqrsActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './PqrsList.module.css';

interface PqrsRespuesta {
    id: number;
    mensaje: string;
    created_at: string;
}

interface PqrsItem {
    id: number;
    tipo: string;
    asunto: string;
    mensaje: string;
    estado: PqrsEstado;
    created_at: string;
    updated_at: string;
    pqrs_respuestas?: PqrsRespuesta[];
}

interface PqrsListProps {
    pqrs: PqrsItem[];
}

const ESTADOS: { value: PqrsEstado | 'todos'; label: string }[] = [
    { value: 'todos', label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'en_proceso', label: 'En proceso' },
    { value: 'resuelto', label: 'Resueltas' },
];

const TIPO_LABELS: Record<string, string> = {
    peticion: 'Petición',
    queja: 'Queja',
    reclamo: 'Reclamo',
    sugerencia: 'Sugerencia',
};

const ESTADO_LABELS: Record<PqrsEstado, string> = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    resuelto: 'Resuelto',
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function PqrsList({ pqrs }: PqrsListProps) {
    const [filtro, setFiltro] = useState<PqrsEstado | 'todos'>('todos');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const filtered = filtro === 'todos'
        ? pqrs
        : pqrs.filter((p) => p.estado === filtro);

    if (pqrs.length === 0) {
        return (
            <div className={styles.emptyState}>
                <DynamicIcon name="Inbox" size={48} className={styles.emptyIcon} />
                <h2>No tienes solicitudes PQRS</h2>
                <p>Envía una petición, queja, reclamo o sugerencia y podrás hacer seguimiento aquí.</p>
                <Link href="/dashboard/pqrs/nueva" className={styles.createBtn}>
                    <DynamicIcon name="Plus" size={18} />
                    Nueva Solicitud
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.filters}>
                {ESTADOS.map((e) => (
                    <button
                        key={e.value}
                        type="button"
                        className={`${styles.filterBtn} ${filtro === e.value ? styles.filterBtnActive : ''}`}
                        onClick={() => setFiltro(e.value)}
                    >
                        {e.label}
                        {e.value !== 'todos' && (
                            <span className={styles.filterCount}>
                                {pqrs.filter((p) => p.estado === e.value).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className={styles.noResults}>
                    <p>No hay solicitudes con estado &quot;{ESTADO_LABELS[filtro as PqrsEstado]}&quot;.</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {filtered.map((item) => {
                        const isExpanded = expandedId === item.id;
                        const respuestas = item.pqrs_respuestas || [];

                        return (
                            <article key={item.id} className={styles.card}>
                                <button
                                    type="button"
                                    className={styles.cardHeader}
                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                >
                                    <div className={styles.cardMain}>
                                        <span className={styles.tipoBadge}>{TIPO_LABELS[item.tipo] || item.tipo}</span>
                                        <h3 className={styles.asunto}>{item.asunto}</h3>
                                        <span className={styles.fecha}>{formatDate(item.created_at)}</span>
                                    </div>
                                    <div className={styles.cardMeta}>
                                        <span className={`${styles.estadoBadge} ${styles[`estado_${item.estado}`]}`}>
                                            {ESTADO_LABELS[item.estado]}
                                        </span>
                                        <DynamicIcon
                                            name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                                            size={20}
                                            className={styles.chevron}
                                        />
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className={styles.cardBody}>
                                        <p className={styles.mensaje}>{item.mensaje}</p>

                                        {respuestas.length > 0 && (
                                            <div className={styles.respuestas}>
                                                <h4 className={styles.respuestasTitle}>
                                                    <DynamicIcon name="MessageCircle" size={16} />
                                                    Respuestas del equipo ({respuestas.length})
                                                </h4>
                                                {respuestas.map((r) => (
                                                    <div key={r.id} className={styles.respuesta}>
                                                        <p>{r.mensaje}</p>
                                                        <span className={styles.respuestaFecha}>{formatDate(r.created_at)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {respuestas.length === 0 && item.estado === 'pendiente' && (
                                            <p className={styles.sinRespuesta}>
                                                Tu solicitud está en cola. Te responderemos pronto.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
