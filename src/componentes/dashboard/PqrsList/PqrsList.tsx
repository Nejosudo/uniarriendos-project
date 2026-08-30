'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PqrsEstado, responderPqrsUsuario } from '@/app/acciones/pqrsActions';
import { uploadImageToCloudinary } from '@/app/acciones/uploadActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import toast from 'react-hot-toast';
import styles from './PqrsList.module.css';

interface PqrsRespuesta {
    id: number;
    mensaje: string;
    imagen_url?: string | null;
    created_at: string;
    admin_id?: string | null;
    usuario_id?: string | null;
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

function PqrsResponder({ pqrsId }: { pqrsId: number }) {
    const [mensaje, setMensaje] = useState('');
    const [imagen, setImagen] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const handleSend = async () => {
        if (mensaje.trim().length < 10) { toast.error('Mensaje mínimo 10 caracteres'); return; }
        setLoading(true);
        let imagenUrl: string | null = null;
        if (imagen) {
            if (imagen.size > 5 * 1024 * 1024) { toast.error('Imagen máx 5MB'); setLoading(false); return; }
            if (!['image/jpeg','image/png','image/webp','image/avif'].includes(imagen.type)) { toast.error('Formato no permitido'); setLoading(false); return; }
            const fd = new FormData(); fd.append('file', imagen);
            const up = await uploadImageToCloudinary(fd);
            if (!up.success) { toast.error(up.error || 'Error subiendo imagen'); setLoading(false); return; }
            imagenUrl = up.url || null;
        }
        const res = await responderPqrsUsuario(pqrsId, mensaje, imagenUrl);
        if (res.success) { toast.success('Respuesta enviada'); setMensaje(''); setImagen(null); window.location.reload(); }
        else toast.error(res.error || 'Error');
        setLoading(false);
    };
    return (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Responder / Anexar evidencia</h4>
            <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={3} placeholder="Responde al equipo o anexa evidencia..." style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'white', color: '#1f2937' }} />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', alignItems: 'center' }}>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => setImagen(e.target.files?.[0] || null)} style={{ fontSize: '0.85rem' }} />
                {imagen && <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>{imagen.name}</span>}
                <button type="button" onClick={handleSend} disabled={loading} style={{ marginLeft: 'auto', padding: '0.6rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600 }}>{loading ? 'Enviando...' : 'Enviar'}</button>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>Máx 5MB, JPG/PNG/WebP/AVIF.</p>
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
                                                    Historial ({respuestas.length})
                                                </h4>
                                                {respuestas.map((r) => (
                                                    <div key={r.id} className={styles.respuesta} style={{ borderLeft: r.usuario_id ? '3px solid var(--color-primary)' : '3px solid #16a34a' }}>
                                                        <p><strong>{r.usuario_id ? 'Tú:' : 'Equipo:'}</strong> {r.mensaje}</p>
                                                        {r.imagen_url && (
                                                            <>
                                                                <img src={r.imagen_url} alt="Evidencia" style={{ maxWidth: 260, borderRadius: 8, marginTop: 6, border: '1px solid var(--color-border)' }} />
                                                                <div style={{ marginTop: 6 }}><a href={r.imagen_url} download target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', padding: '4px 8px', background: '#f1f5f9', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', color: '#1f2937' }}>Ver evidencia</a></div>
                                                            </>
                                                        )}
                                                        <span className={styles.respuestaFecha}>{formatDate(r.created_at)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <PqrsResponder pqrsId={item.id} />

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
