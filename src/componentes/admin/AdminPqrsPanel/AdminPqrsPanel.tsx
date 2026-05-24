'use client';

import { useState } from 'react';
import { responderPqrs, cambiarEstadoPqrs } from '@/app/acciones/adminPqrsActions';
import type { PqrsEstado } from '@/app/acciones/pqrsActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './AdminPqrsPanel.module.css';

interface PqrsItem {
    id: number;
    tipo: string;
    asunto: string;
    mensaje: string;
    estado: PqrsEstado;
    created_at: string;
    usuario?: { nombre_completo: string | null };
    pqrs_respuestas?: { id: number; mensaje: string; created_at: string }[];
}

interface AdminPqrsPanelProps {
    pqrs: PqrsItem[];
}

const TIPO_LABELS: Record<string, string> = {
    peticion: 'Petición',
    queja: 'Queja',
    reclamo: 'Reclamo',
    sugerencia: 'Sugerencia',
};

const ESTADOS: { value: PqrsEstado | 'todos'; label: string }[] = [
    { value: 'todos', label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'en_proceso', label: 'En proceso' },
    { value: 'resuelto', label: 'Resueltas' },
];

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function AdminPqrsPanel({ pqrs: initial }: AdminPqrsPanelProps) {
    const [pqrs, setPqrs] = useState(initial);
    const [filtro, setFiltro] = useState<PqrsEstado | 'todos'>('pendiente');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [respuesta, setRespuesta] = useState('');
    const [nuevoEstado, setNuevoEstado] = useState<PqrsEstado>('resuelto');
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [error, setError] = useState('');

    const filtradas =
        filtro === 'todos' ? pqrs : pqrs.filter((p) => p.estado === filtro);

    const handleResponder = async (id: number) => {
        setLoadingId(id);
        setError('');
        const result = await responderPqrs(id, respuesta, nuevoEstado);
        if (result.success) {
            setRespuesta('');
            setExpandedId(null);
            window.location.reload();
        } else {
            setError(result.error || 'Error al responder');
        }
        setLoadingId(null);
    };

    const handleEstado = async (id: number, estado: PqrsEstado) => {
        setLoadingId(id);
        const result = await cambiarEstadoPqrs(id, estado);
        if (result.success) {
            setPqrs(pqrs.map((p) => (p.id === id ? { ...p, estado } : p)));
        } else {
            alert(result.error);
        }
        setLoadingId(null);
    };

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
                            <span className={styles.badge}>
                                {pqrs.filter((p) => p.estado === e.value).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {filtradas.length === 0 ? (
                <p className={styles.empty}>No hay solicitudes en este estado.</p>
            ) : (
                <div className={styles.list}>
                    {filtradas.map((item) => {
                        const isOpen = expandedId === item.id;
                        const respuestas = item.pqrs_respuestas || [];

                        return (
                            <article key={item.id} className={styles.card}>
                                <button
                                    type="button"
                                    className={styles.cardHeader}
                                    onClick={() => {
                                        setExpandedId(isOpen ? null : item.id);
                                        setError('');
                                        setRespuesta('');
                                    }}
                                >
                                    <div>
                                        <span className={styles.tipo}>{TIPO_LABELS[item.tipo]}</span>
                                        <h3>{item.asunto}</h3>
                                        <p className={styles.meta}>
                                            {item.usuario?.nombre_completo || 'Usuario'} · {formatDate(item.created_at)}
                                        </p>
                                    </div>
                                    <div className={styles.cardRight}>
                                        <select
                                            value={item.estado}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleEstado(item.id, e.target.value as PqrsEstado);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={loadingId === item.id}
                                            className={styles.estadoSelect}
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="en_proceso">En proceso</option>
                                            <option value="resuelto">Resuelto</option>
                                        </select>
                                        <DynamicIcon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={20} />
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className={styles.cardBody}>
                                        <p className={styles.mensaje}>{item.mensaje}</p>

                                        {respuestas.length > 0 && (
                                            <div className={styles.respuestas}>
                                                <h4>Respuestas anteriores</h4>
                                                {respuestas.map((r) => (
                                                    <div key={r.id} className={styles.respuesta}>
                                                        <p>{r.mensaje}</p>
                                                        <span>{formatDate(r.created_at)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className={styles.replyForm}>
                                            <h4>Responder</h4>
                                            {error && <p className={styles.error}>{error}</p>}
                                            <textarea
                                                value={respuesta}
                                                onChange={(e) => setRespuesta(e.target.value)}
                                                rows={4}
                                                placeholder="Escribe tu respuesta al usuario..."
                                                className={styles.textarea}
                                            />
                                            <div className={styles.replyActions}>
                                                <select
                                                    value={nuevoEstado}
                                                    onChange={(e) => setNuevoEstado(e.target.value as PqrsEstado)}
                                                    className={styles.estadoSelect}
                                                >
                                                    <option value="en_proceso">Marcar en proceso</option>
                                                    <option value="resuelto">Marcar resuelto</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    className={styles.sendBtn}
                                                    onClick={() => handleResponder(item.id)}
                                                    disabled={loadingId === item.id || respuesta.trim().length < 10}
                                                >
                                                    <DynamicIcon name="Send" size={16} />
                                                    Enviar respuesta
                                                </button>
                                            </div>
                                        </div>
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
