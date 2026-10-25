'use client';

import { useMemo, useState } from 'react';
import { responderPqrs, cambiarEstadoPqrs } from '@/app/acciones/adminPqrsActions';
import type { PqrsEstado } from '@/app/acciones/pqrsActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import toast from 'react-hot-toast';
import { isAllowedImageUrl } from '@/lib/validation';
import styles from './AdminPqrsPanel.module.css';

interface PqrsItem {
    id: number;
    tipo: string;
    asunto: string;
    mensaje: string;
    estado: PqrsEstado;
    created_at: string;
    usuario?: { nombre_completo: string | null } | null;
    pqrs_respuestas?: {
        id: number;
        mensaje: string;
        imagen_url?: string | null;
        usuario_id?: string | null;
        admin_id?: string | null;
        created_at: string;
    }[];
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

const POR_PAGINA = 10;

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
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [respuesta, setRespuesta] = useState('');
    const [nuevoEstado, setNuevoEstado] = useState<PqrsEstado>('resuelto');
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [error, setError] = useState('');

    const filtradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return pqrs.filter((item) => {
            if (filtro !== 'todos' && item.estado !== filtro) return false;
            if (filtroTipo !== 'todos' && item.tipo !== filtroTipo) return false;
            if (!q) return true;
            return (
                item.asunto.toLowerCase().includes(q) ||
                item.mensaje.toLowerCase().includes(q) ||
                item.usuario?.nombre_completo?.toLowerCase().includes(q)
            );
        });
    }, [pqrs, filtro, filtroTipo, busqueda]);

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const visibles = filtradas.slice(
        (paginaActual - 1) * POR_PAGINA,
        paginaActual * POR_PAGINA
    );

    const handleResponder = async (id: number) => {
        setLoadingId(id);
        setError('');
        const result = await responderPqrs(id, respuesta, nuevoEstado);
        if (result.success) {
            const respuestaGuardada = result.respuesta;
            if (!respuestaGuardada) {
                toast.error('La respuesta se guardó, pero no se pudo actualizar la vista. Recarga la página.');
                return;
            }

            setPqrs((prev) => prev.map((item) => (
                item.id === id
                    ? {
                        ...item,
                        estado: result.estado ?? nuevoEstado,
                        pqrs_respuestas: [...(item.pqrs_respuestas || []), respuestaGuardada],
                    }
                    : item
            )));
            setRespuesta('');
            setExpandedId(null);
            toast.success('Respuesta enviada');
        } else {
            setError(result.error || 'Error al responder');
        }
        setLoadingId(null);
    };

    const handleEstado = async (id: number, estado: PqrsEstado) => {
        setLoadingId(id);
        const result = await cambiarEstadoPqrs(id, estado);
        if (result.success) {
            setPqrs((prev) => prev.map((item) => (item.id === id ? { ...item, estado } : item)));
            toast.success('Estado de PQRS actualizado');
        } else {
            toast.error(result.error || 'No se pudo actualizar el estado de la PQRS');
        }
        setLoadingId(null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.filters}>
                {ESTADOS.map((estado) => (
                    <button
                        key={estado.value}
                        type="button"
                        className={`${styles.filterBtn} ${filtro === estado.value ? styles.filterBtnActive : ''}`}
                        onClick={() => {
                            setFiltro(estado.value);
                            setPagina(1);
                        }}
                    >
                        {estado.label}
                        {estado.value !== 'todos' && (
                            <span className={styles.badge}>
                                {pqrs.filter((item) => item.estado === estado.value).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <DynamicIcon name="Search" size={18} />
                    <input
                        type="search"
                        placeholder="Buscar por asunto, mensaje o usuario..."
                        value={busqueda}
                        onChange={(event) => {
                            setBusqueda(event.target.value);
                            setPagina(1);
                        }}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.toolbarRight}>
                    <select
                        value={filtroTipo}
                        onChange={(event) => {
                            setFiltroTipo(event.target.value);
                            setPagina(1);
                        }}
                        className={styles.estadoSelect}
                        aria-label="Filtrar por tipo de PQRS"
                    >
                        <option value="todos">Todos los tipos</option>
                        <option value="peticion">Peticiones</option>
                        <option value="queja">Quejas</option>
                        <option value="reclamo">Reclamos</option>
                        <option value="sugerencia">Sugerencias</option>
                    </select>
                    <span className={styles.count}>{filtradas.length} solicitudes</span>
                </div>
            </div>

            {visibles.length === 0 ? (
                <p className={styles.empty}>No hay solicitudes con estos filtros.</p>
            ) : (
                <div className={styles.list}>
                    {visibles.map((item) => {
                        const isOpen = expandedId === item.id;
                        const respuestas = item.pqrs_respuestas || [];

                        return (
                            <article key={item.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <button
                                        type="button"
                                        className={styles.cardHeaderMain}
                                        onClick={() => {
                                            setExpandedId(isOpen ? null : item.id);
                                            setError('');
                                            setRespuesta('');
                                            setNuevoEstado('resuelto');
                                        }}
                                        aria-expanded={isOpen}
                                    >
                                        <div>
                                            <span className={styles.tipo}>{TIPO_LABELS[item.tipo] || item.tipo}</span>
                                            <h3>{item.asunto}</h3>
                                            <p className={styles.meta}>
                                                {item.usuario?.nombre_completo || 'Usuario'} · {formatDate(item.created_at)}
                                            </p>
                                        </div>
                                    </button>
                                    <div className={styles.cardRight}>
                                        <select
                                            value={item.estado}
                                            onChange={(event) => void handleEstado(item.id, event.target.value as PqrsEstado)}
                                            disabled={loadingId === item.id}
                                            className={styles.estadoSelect}
                                            aria-label={`Estado de la PQRS ${item.asunto}`}
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="en_proceso">En proceso</option>
                                            <option value="resuelto">Resuelto</option>
                                        </select>
                                        <button
                                            type="button"
                                            className={styles.expandBtn}
                                            onClick={() => {
                                                setExpandedId(isOpen ? null : item.id);
                                                setError('');
                                                setRespuesta('');
                                                setNuevoEstado('resuelto');
                                            }}
                                            aria-label={isOpen ? 'Contraer PQRS' : 'Expandir PQRS'}
                                        >
                                            <DynamicIcon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={20} />
                                        </button>
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className={styles.cardBody}>
                                        <p className={styles.mensaje}>{item.mensaje}</p>

                                        {respuestas.length > 0 && (
                                            <div className={styles.respuestas}>
                                                <h4>Respuestas anteriores</h4>
                                                {respuestas.map((respuestaItem) => (
                                                    <div key={respuestaItem.id} className={styles.respuesta}>
                                                        <p>
                                                            <strong>{respuestaItem.usuario_id ? 'Usuario:' : 'Equipo:'}</strong>{' '}
                                                            {respuestaItem.mensaje}
                                                        </p>
                                                        {respuestaItem.imagen_url && isAllowedImageUrl(respuestaItem.imagen_url) && (
                                                            <div className={styles.evidencia}>
                                                                <img src={respuestaItem.imagen_url} alt="Evidencia" />
                                                                <div className={styles.evidenciaActions}>
                                                                    <a
                                                                        href={respuestaItem.imagen_url.includes('/upload/')
                                                                            ? respuestaItem.imagen_url.replace('/upload/', '/upload/fl_attachment/')
                                                                            : respuestaItem.imagen_url}
                                                                        download={`evidencia-pqrs-${respuestaItem.id}.jpg`}
                                                                    >
                                                                        ⬇ Descargar evidencia
                                                                    </a>
                                                                    <a
                                                                        href={respuestaItem.imagen_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        Ver original
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <span>{formatDate(respuestaItem.created_at)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className={styles.replyForm}>
                                            <h4>Responder</h4>
                                            {error && <p className={styles.error}>{error}</p>}
                                            <textarea
                                                value={respuesta}
                                                onChange={(event) => setRespuesta(event.target.value)}
                                                rows={4}
                                                placeholder="Escribe tu respuesta al usuario..."
                                                className={styles.textarea}
                                            />
                                            <div className={styles.replyActions}>
                                                <select
                                                    value={nuevoEstado}
                                                    onChange={(event) => setNuevoEstado(event.target.value as PqrsEstado)}
                                                    className={styles.estadoSelect}
                                                    aria-label="Nuevo estado de la PQRS"
                                                >
                                                    <option value="en_proceso">Marcar en proceso</option>
                                                    <option value="resuelto">Marcar resuelto</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    className={styles.sendBtn}
                                                    onClick={() => void handleResponder(item.id)}
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
