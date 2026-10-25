'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    adminCambiarEstadoPropiedad,
    adminCambiarPrioridad,
    adminToggleVerificada,
} from '@/app/acciones/adminPropiedadesActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import toast from 'react-hot-toast';
import styles from './AdminPropiedadesTable.module.css';

interface FotoPropiedad {
    url: string;
    orden?: number | null;
}

interface PropiedadAdmin {
    id: number;
    titulo: string;
    precio: number;
    ubicacion_texto: string;
    estado: 'disponible' | 'ocupado' | 'inactivo';
    prioridad: 'comun' | 'recomendada';
    verificada: boolean;
    created_at: string;
    propiedades_fotos?: FotoPropiedad[];
    propietario?: { nombre_completo: string | null } | { nombre_completo: string | null }[] | null;
}

interface AdminPropiedadesTableProps {
    propiedades: PropiedadAdmin[];
}

const POR_PAGINA = 12;

function portada(propiedad: PropiedadAdmin) {
    const fotos = [...(propiedad.propiedades_fotos || [])];
    fotos.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    return fotos[0]?.url ?? null;
}

export default function AdminPropiedadesTable({ propiedades: initial }: AdminPropiedadesTableProps) {
    const [propiedades, setPropiedades] = useState(initial);
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'todos' | PropiedadAdmin['estado']>('todos');
    const [filtroPrioridad, setFiltroPrioridad] = useState<'todas' | PropiedadAdmin['prioridad']>('todas');
    const [filtroVerificada, setFiltroVerificada] = useState<'todas' | 'si' | 'no'>('todas');
    const [pagina, setPagina] = useState(1);

    const filtradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return propiedades.filter((propiedad) => {
            if (filtroEstado !== 'todos' && propiedad.estado !== filtroEstado) return false;
            if (filtroPrioridad !== 'todas' && (propiedad.prioridad || 'comun') !== filtroPrioridad) return false;
            if (filtroVerificada === 'si' && !propiedad.verificada) return false;
            if (filtroVerificada === 'no' && propiedad.verificada) return false;
            if (!q) return true;

            const anfitrion = Array.isArray(propiedad.propietario)
                ? propiedad.propietario[0]
                : propiedad.propietario;

            return (
                propiedad.titulo.toLowerCase().includes(q) ||
                propiedad.ubicacion_texto.toLowerCase().includes(q) ||
                anfitrion?.nombre_completo?.toLowerCase().includes(q)
            );
        });
    }, [propiedades, busqueda, filtroEstado, filtroPrioridad, filtroVerificada]);

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const visibles = filtradas.slice(
        (paginaActual - 1) * POR_PAGINA,
        paginaActual * POR_PAGINA
    );

    const updateProp = (id: number, patch: Partial<PropiedadAdmin>) => {
        setPropiedades((prev) => prev.map((propiedad) => (
            propiedad.id === id ? { ...propiedad, ...patch } : propiedad
        )));
    };

    const handleEstado = async (id: number, estado: PropiedadAdmin['estado']) => {
        setLoadingId(id);
        const result = await adminCambiarEstadoPropiedad(id, estado);
        if (result.success) {
            updateProp(id, { estado });
            toast.success('Estado actualizado');
        } else {
            toast.error(result.error || 'No se pudo actualizar el estado');
        }
        setLoadingId(null);
    };

    const handlePrioridad = async (id: number, prioridad: PropiedadAdmin['prioridad']) => {
        setLoadingId(id);
        const result = await adminCambiarPrioridad(id, prioridad);
        if (result.success) {
            updateProp(id, { prioridad });
            toast.success('Prioridad actualizada');
        } else {
            toast.error(result.error || 'No se pudo actualizar la prioridad');
        }
        setLoadingId(null);
    };

    const handleVerificada = async (id: number, verificada: boolean) => {
        setLoadingId(id);
        const result = await adminToggleVerificada(id, verificada);
        if (result.success) {
            updateProp(id, { verificada });
            toast.success(verificada ? 'Propiedad verificada' : 'Verificación retirada');
        } else {
            toast.error(result.error || 'No se pudo actualizar la verificación');
        }
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
                        onChange={(event) => {
                            setBusqueda(event.target.value);
                            setPagina(1);
                        }}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.filters}>
                    <select
                        value={filtroEstado}
                        onChange={(event) => {
                            setFiltroEstado(event.target.value as 'todos' | PropiedadAdmin['estado']);
                            setPagina(1);
                        }}
                        className={styles.select}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="disponible">Disponibles</option>
                        <option value="ocupado">Ocupadas</option>
                        <option value="inactivo">Ocultas</option>
                    </select>
                    <select
                        value={filtroPrioridad}
                        onChange={(event) => {
                            setFiltroPrioridad(event.target.value as 'todas' | PropiedadAdmin['prioridad']);
                            setPagina(1);
                        }}
                        className={styles.select}
                    >
                        <option value="todas">Toda prioridad</option>
                        <option value="comun">Comunes</option>
                        <option value="recomendada">Destacadas</option>
                    </select>
                    <select
                        value={filtroVerificada}
                        onChange={(event) => {
                            setFiltroVerificada(event.target.value as 'todas' | 'si' | 'no');
                            setPagina(1);
                        }}
                        className={styles.select}
                    >
                        <option value="todas">Toda verificación</option>
                        <option value="si">Verificadas</option>
                        <option value="no">No verificadas</option>
                    </select>
                    <span className={styles.count}>{filtradas.length} propiedades</span>
                </div>
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
                        {visibles.map((propiedad) => {
                            const imgUrl = portada(propiedad);
                            const anfitrion = Array.isArray(propiedad.propietario)
                                ? propiedad.propietario[0]
                                : propiedad.propietario;
                            const fotosCount = propiedad.propiedades_fotos?.length ?? 0;

                            return (
                                <tr key={propiedad.id} className={loadingId === propiedad.id ? styles.rowLoading : ''}>
                                    <td>
                                        <div className={styles.propInfo}>
                                            <div className={styles.imgWrapper}>
                                                {imgUrl ? (
                                                    <Image
                                                        src={imgUrl}
                                                        alt={propiedad.titulo}
                                                        width={80}
                                                        height={60}
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div className={styles.imgPlaceholder}>
                                                        <DynamicIcon name="Image" size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <strong>{propiedad.titulo}</strong>
                                                <span className={styles.location}>{propiedad.ubicacion_texto}</span>
                                                <span className={styles.photoCount}>{fotosCount} {fotosCount === 1 ? 'foto' : 'fotos'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{anfitrion?.nombre_completo || '—'}</td>
                                    <td>${propiedad.precio?.toLocaleString('es-CO')}</td>
                                    <td>
                                        <select
                                            value={propiedad.estado}
                                            onChange={(event) => void handleEstado(propiedad.id, event.target.value as PropiedadAdmin['estado'])}
                                            disabled={loadingId === propiedad.id}
                                            className={styles.select}
                                        >
                                            <option value="disponible">Disponible</option>
                                            <option value="ocupado">Ocupado</option>
                                            <option value="inactivo">Oculto</option>
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            value={propiedad.prioridad || 'comun'}
                                            onChange={(event) => void handlePrioridad(propiedad.id, event.target.value as PropiedadAdmin['prioridad'])}
                                            disabled={loadingId === propiedad.id}
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
                                                checked={!!propiedad.verificada}
                                                onChange={(event) => void handleVerificada(propiedad.id, event.target.checked)}
                                                disabled={loadingId === propiedad.id}
                                            />
                                            {propiedad.verificada ? 'Sí' : 'No'}
                                        </label>
                                    </td>
                                    <td>
                                        <Link
                                            href={`/propiedades/${propiedad.id}`}
                                            target="_blank"
                                            className={styles.viewBtn}
                                            title={propiedad.estado === 'inactivo' ? 'Previsualizar propiedad oculta' : 'Ver pública'}
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
