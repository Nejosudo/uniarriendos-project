'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import {
    adminAprobarResena,
    adminEliminarResena,
    adminOcultarResena,
} from '@/app/acciones/adminResenasActions';
import styles from './AdminResenasTable.module.css';

interface ResenaAdmin {
    id: number;
    propiedad_id: number;
    calificacion: number;
    comentario: string;
    reportada: boolean;
    created_at: string;
    usuario?: { nombre_completo: string | null; avatar_url: string | null } | null;
    propiedad?: { titulo: string | null } | null;
}

interface AdminResenasTableProps {
    resenas: ResenaAdmin[];
}

const POR_PAGINA = 10;

function fecha(value: string) {
    return new Date(value).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default function AdminResenasTable({ resenas: initial }: AdminResenasTableProps) {
    const [resenas, setResenas] = useState(initial);
    const [filtro, setFiltro] = useState<'reportadas' | 'visibles' | 'todas'>('reportadas');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const filtradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return resenas.filter((resena) => {
            if (filtro === 'reportadas' && !resena.reportada) return false;
            if (filtro === 'visibles' && resena.reportada) return false;
            if (!q) return true;
            return (
                resena.comentario.toLowerCase().includes(q) ||
                resena.usuario?.nombre_completo?.toLowerCase().includes(q) ||
                resena.propiedad?.titulo?.toLowerCase().includes(q)
            );
        });
    }, [resenas, filtro, busqueda]);

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const visibles = filtradas.slice(
        (paginaActual - 1) * POR_PAGINA,
        paginaActual * POR_PAGINA
    );

    const ejecutar = async (
        id: number,
        accion: () => Promise<{ success: boolean; error?: string }>,
        mensaje: string,
        actualizar: (resena: ResenaAdmin) => ResenaAdmin | null
    ) => {
        setLoadingId(id);
        const result = await accion();
        if (result.success) {
            setResenas((prev) => prev
                .map((resena) => (resena.id === id ? actualizar(resena) : resena))
                .filter((resena): resena is ResenaAdmin => resena !== null));
            toast.success(mensaje);
        } else {
            toast.error(result.error || 'No se pudo completar la acción');
        }
        setLoadingId(null);
    };

    const aprobar = (resena: ResenaAdmin) => {
        void ejecutar(
            resena.id,
            () => adminAprobarResena(resena.id),
            'Reseña aprobada',
            (item) => ({ ...item, reportada: false })
        );
    };

    const ocultar = (resena: ResenaAdmin) => {
        if (!window.confirm('¿Ocultar esta reseña de la propiedad?')) return;
        void ejecutar(
            resena.id,
            () => adminOcultarResena(resena.id),
            'Reseña ocultada',
            (item) => ({ ...item, reportada: true })
        );
    };

    const eliminar = (resena: ResenaAdmin) => {
        if (!window.confirm('¿Eliminar esta reseña definitivamente? Esta acción no se puede deshacer.')) return;
        void ejecutar(
            resena.id,
            () => adminEliminarResena(resena.id),
            'Reseña eliminada',
            () => null
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    {([
                        ['reportadas', 'Reportadas'],
                        ['visibles', 'Visibles'],
                        ['todas', 'Todas'],
                    ] as const).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            className={`${styles.filterBtn} ${filtro === value ? styles.filterBtnActive : ''}`}
                            onClick={() => {
                                setFiltro(value);
                                setPagina(1);
                            }}
                        >
                            {label}
                            <span className={styles.badge}>
                                {value === 'todas'
                                    ? resenas.length
                                    : resenas.filter((resena) => value === 'reportadas' ? resena.reportada : !resena.reportada).length}
                            </span>
                        </button>
                    ))}
                </div>
                <div className={styles.searchWrapper}>
                    <DynamicIcon name="Search" size={18} />
                    <input
                        type="search"
                        placeholder="Buscar por comentario, usuario o propiedad..."
                        value={busqueda}
                        onChange={(event) => {
                            setBusqueda(event.target.value);
                            setPagina(1);
                        }}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Reseña</th>
                            <th>Usuario</th>
                            <th>Propiedad</th>
                            <th>Calificación</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.map((resena) => (
                            <tr key={resena.id} className={loadingId === resena.id ? styles.rowLoading : ''}>
                                <td className={styles.commentCell}>{resena.comentario}</td>
                                <td>{resena.usuario?.nombre_completo || 'Sin nombre'}</td>
                                <td>
                                    <Link
                                        href={`/propiedades/${resena.propiedad_id}`}
                                        target="_blank"
                                        className={styles.propertyLink}
                                    >
                                        {resena.propiedad?.titulo || `Propiedad #${resena.propiedad_id}`}
                                        <DynamicIcon name="ExternalLink" size={14} />
                                    </Link>
                                </td>
                                <td className={styles.rating}>{resena.calificacion} / 5</td>
                                <td>
                                    <span className={resena.reportada ? styles.badgeHidden : styles.badgeVisible}>
                                        {resena.reportada ? 'Reportada' : 'Visible'}
                                    </span>
                                </td>
                                <td className={styles.dateCell}>{fecha(resena.created_at)}</td>
                                <td>
                                    <div className={styles.actions}>
                                        {resena.reportada ? (
                                            <button
                                                type="button"
                                                className={styles.btnApprove}
                                                onClick={() => aprobar(resena)}
                                                disabled={loadingId === resena.id}
                                            >
                                                <DynamicIcon name="CheckCircle" size={15} />
                                                Aprobar
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className={styles.btnHide}
                                                onClick={() => ocultar(resena)}
                                                disabled={loadingId === resena.id}
                                            >
                                                <DynamicIcon name="AlertTriangle" size={15} />
                                                Ocultar
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className={styles.btnDelete}
                                            onClick={() => eliminar(resena)}
                                            disabled={loadingId === resena.id}
                                        >
                                            <DynamicIcon name="Trash2" size={15} />
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtradas.length === 0 && (
                    <p className={styles.empty}>No hay reseñas para este filtro.</p>
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
