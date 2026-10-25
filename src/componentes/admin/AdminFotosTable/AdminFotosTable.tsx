'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import { adminRevisarFoto } from '@/app/acciones/adminFotosActions';
import styles from './AdminFotosTable.module.css';

type ResultadoFoto = 'pendiente' | 'aprobada' | 'rechazada';

interface FotoValidacion {
    id: number;
    usuario_id: string | null;
    propiedad_id: number | null;
    foto_url: string | null;
    resultado: ResultadoFoto;
    motivo: string | null;
    revisado_por: string | null;
    created_at: string;
    usuario?: { nombre_completo: string | null } | null;
    propiedad?: { id: number; titulo: string | null } | null;
}

interface AdminFotosTableProps {
    fotos: FotoValidacion[];
}

const POR_PAGINA = 12;

const RESULTADO_LABEL: Record<ResultadoFoto, string> = {
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
};

function fecha(value: string) {
    return new Date(value).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function AdminFotosTable({ fotos: initial }: AdminFotosTableProps) {
    const [fotos, setFotos] = useState(initial);
    const [filtro, setFiltro] = useState<ResultadoFoto | 'todas'>('pendiente');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const filtradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return fotos.filter((foto) => {
            if (filtro !== 'todas' && foto.resultado !== filtro) return false;
            if (!q) return true;
            return (
                foto.usuario?.nombre_completo?.toLowerCase().includes(q) ||
                foto.propiedad?.titulo?.toLowerCase().includes(q) ||
                foto.motivo?.toLowerCase().includes(q) ||
                foto.foto_url?.toLowerCase().includes(q)
            );
        });
    }, [fotos, filtro, busqueda]);

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const visibles = filtradas.slice(
        (paginaActual - 1) * POR_PAGINA,
        paginaActual * POR_PAGINA
    );

    const revisar = async (foto: FotoValidacion, resultado: ResultadoFoto) => {
        let motivo: string | undefined;
        if (resultado === 'rechazada') {
            const respuesta = window.prompt('Motivo del rechazo (opcional):', '');
            if (respuesta === null) return;
            motivo = respuesta.trim() || 'Rechazada por administrador';
        }

        setLoadingId(foto.id);
        const result = await adminRevisarFoto(foto.id, resultado, motivo);
        if (result.success) {
            setFotos((prev) => prev.map((item) => (
                item.id === foto.id
                    ? { ...item, resultado, motivo: motivo || item.motivo, revisado_por: 'actual' }
                    : item
            )));
            toast.success(resultado === 'aprobada' ? 'Foto aprobada' : 'Foto rechazada');
        } else {
            toast.error(result.error || 'No se pudo revisar la foto');
        }
        setLoadingId(null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    {([
                        ['pendiente', 'Pendientes'],
                        ['aprobada', 'Aprobadas'],
                        ['rechazada', 'Rechazadas'],
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
                                    ? fotos.length
                                    : fotos.filter((foto) => foto.resultado === value).length}
                            </span>
                        </button>
                    ))}
                </div>
                <div className={styles.searchWrapper}>
                    <DynamicIcon name="Search" size={18} />
                    <input
                        type="search"
                        placeholder="Buscar por usuario, propiedad o motivo..."
                        value={busqueda}
                        onChange={(event) => {
                            setBusqueda(event.target.value);
                            setPagina(1);
                        }}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {visibles.length === 0 ? (
                <p className={styles.empty}>No hay fotos para este filtro.</p>
            ) : (
                <div className={styles.grid}>
                    {visibles.map((foto) => (
                        <article key={foto.id} className={styles.card}>
                            <a
                                href={foto.foto_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.imageLink}
                            >
                                {foto.foto_url && (
                                    <Image
                                        src={foto.foto_url}
                                        alt="Foto en revisión"
                                        width={360}
                                        height={220}
                                        className={styles.image}
                                    />
                                )}
                            </a>
                            <div className={styles.body}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.status} ${styles[`status_${foto.resultado}`]}`}>
                                        {RESULTADO_LABEL[foto.resultado]}
                                    </span>
                                    <span className={styles.date}>{fecha(foto.created_at)}</span>
                                </div>
                                <p className={styles.meta}>
                                    <strong>{foto.usuario?.nombre_completo || 'Usuario sin nombre'}</strong>
                                    {foto.propiedad ? (
                                        <>
                                            {' · '}
                                            <Link href={`/propiedades/${foto.propiedad.id}`} target="_blank">
                                                {foto.propiedad.titulo || `Propiedad #${foto.propiedad.id}`}
                                            </Link>
                                        </>
                                    ) : ' · Sin propiedad asociada'}
                                </p>
                                {foto.motivo && (
                                    <p className={styles.reason}>
                                        {foto.motivo.replace(/^(propiedad|perfil|pqrs):/, '').replaceAll('_', ' ')}
                                    </p>
                                )}
                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        className={styles.btnApprove}
                                        onClick={() => void revisar(foto, 'aprobada')}
                                        disabled={loadingId === foto.id || foto.resultado === 'aprobada'}
                                    >
                                        <DynamicIcon name="CheckCircle" size={15} />
                                        Aprobar
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.btnReject}
                                        onClick={() => void revisar(foto, 'rechazada')}
                                        disabled={loadingId === foto.id || foto.resultado === 'rechazada'}
                                    >
                                        <DynamicIcon name="Ban" size={15} />
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
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
