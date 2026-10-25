'use client';

import { useMemo, useState } from 'react';
import {
    suspenderUsuario,
    levantarSuspension,
} from '@/app/acciones/suspensionesActions';
import { cambiarRolUsuario } from '@/app/acciones/adminUsuariosActions';
import type { RolUsuario } from '@/lib/suspensiones/types';
import { suspensionEstaVigente } from '@/lib/suspensiones/types';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import UserBadge from '@/componentes/ui/UserBadge/UserBadge';
import styles from './AdminUsuariosTable.module.css';
import type { NivelSuspension } from '@/lib/suspensiones/types';
import toast from 'react-hot-toast';

interface Suspension {
    id: number;
    nivel: number;
    motivo: string | null;
    fecha_fin: string | null;
    activa: boolean;
}

interface Usuario {
    id: string;
    nombre_completo: string | null;
    email?: string | null;
    telefono: string | null;
    rol: RolUsuario;
    tipo?: string | null;
    created_at: string;
    ultimo_admin?: boolean;
    propiedades_count?: number;
    pqrs_count?: number;
    resenas_count?: number;
    suspensiones?: Suspension[];
}

interface AdminUsuariosTableProps {
    usuarios: Usuario[];
    currentUserId: string;
}

const NIVEL_LABELS: Record<NivelSuspension, string> = {
    1: '1 mes',
    2: '3 meses',
    3: 'Ban permanente',
};

const POR_PAGINA = 15;

function fecha(value: string) {
    return new Date(value).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default function AdminUsuariosTable({ usuarios: initial, currentUserId }: AdminUsuariosTableProps) {
    const [usuarios, setUsuarios] = useState(initial);
    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState<'todos' | RolUsuario>('todos');
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'suspendido'>('todos');
    const [pagina, setPagina] = useState(1);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [suspendModal, setSuspendModal] = useState<{ id: string; nombre: string; esAdmin: boolean } | null>(null);
    const [detalle, setDetalle] = useState<Usuario | null>(null);
    const [nivel, setNivel] = useState<NivelSuspension>(1);
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');

    const suspensionActiva = (usuario: Usuario) =>
        usuario.suspensiones?.find((suspension) => suspensionEstaVigente(suspension)) ?? null;

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return usuarios.filter((usuario) => {
            if (filtroRol !== 'todos' && usuario.rol !== filtroRol) return false;

            const suspendido = !!suspensionActiva(usuario);
            if (filtroEstado === 'activo' && suspendido) return false;
            if (filtroEstado === 'suspendido' && !suspendido) return false;

            if (!q) return true;
            return (
                usuario.nombre_completo?.toLowerCase().includes(q) ||
                usuario.email?.toLowerCase().includes(q) ||
                usuario.telefono?.includes(q) ||
                usuario.id.toLowerCase().includes(q)
            );
        });
    }, [usuarios, busqueda, filtroRol, filtroEstado]);

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const visibles = filtrados.slice(
        (paginaActual - 1) * POR_PAGINA,
        paginaActual * POR_PAGINA
    );

    const handleRolChange = async (usuario: Usuario, rol: RolUsuario) => {
        if (rol === usuario.rol) return;

        setLoadingId(usuario.id);
        const result = await cambiarRolUsuario(usuario.id, rol);
        if (result.success) {
            setUsuarios((prev) => prev.map((item) => (item.id === usuario.id ? { ...item, rol } : item)));
            toast.success('Rol actualizado');
        } else {
            toast.error(result.error || 'No se pudo actualizar el rol');
        }
        setLoadingId(null);
    };

    const handleSuspender = async () => {
        if (!suspendModal) return;
        setLoadingId(suspendModal.id);
        setError('');
        const result = await suspenderUsuario(suspendModal.id, nivel, motivo);
        if (result.success) {
            setSuspendModal(null);
            setMotivo('');
            toast.success('Usuario suspendido');
            window.location.reload();
        } else {
            setError(result.error || 'Error al suspender');
        }
        setLoadingId(null);
    };

    const handleLevantar = async (id: string) => {
        if (!window.confirm('¿Levantar la suspensión de este usuario?')) return;
        setLoadingId(id);
        const result = await levantarSuspension(id);
        if (result.success) {
            toast.success('Suspensión levantada');
            window.location.reload();
        } else {
            toast.error(result.error || 'No se pudo levantar la suspensión');
        }
        setLoadingId(null);
    };

    const abrirSuspension = (usuario: Usuario) => {
        setSuspendModal({
            id: usuario.id,
            nombre: usuario.nombre_completo || 'Usuario',
            esAdmin: usuario.rol === 'admin',
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <DynamicIcon name="Search" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email, teléfono o ID..."
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
                        value={filtroRol}
                        onChange={(event) => {
                            setFiltroRol(event.target.value as 'todos' | RolUsuario);
                            setPagina(1);
                        }}
                        className={styles.select}
                    >
                        <option value="todos">Todos los roles</option>
                        <option value="usuario">Usuarios</option>
                        <option value="admin">Administradores</option>
                    </select>
                    <select
                        value={filtroEstado}
                        onChange={(event) => {
                            setFiltroEstado(event.target.value as 'todos' | 'activo' | 'suspendido');
                            setPagina(1);
                        }}
                        className={styles.select}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="activo">Activos</option>
                        <option value="suspendido">Suspendidos</option>
                    </select>
                    <span className={styles.count}>{filtrados.length} usuarios</span>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Tipo</th>
                            <th>Teléfono</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.map((usuario) => {
                            const suspension = suspensionActiva(usuario);
                            const esPropioUsuario = usuario.id === currentUserId;
                            return (
                                <tr key={usuario.id} className={loadingId === usuario.id ? styles.rowLoading : ''}>
                                    <td>
                                        <div className={styles.userInfo}>
                                            <strong>{usuario.nombre_completo || 'Sin nombre'}</strong>
                                            <span className={styles.userEmail}>{usuario.email || 'Sin email'}</span>
                                            <span className={styles.userId}>{usuario.id.slice(0, 8)}…</span>
                                        </div>
                                    </td>
                                    <td>
                                        <UserBadge tipo={usuario.tipo} />
                                    </td>
                                    <td>{usuario.telefono || '—'}</td>
                                    <td>
                                        <select
                                            value={usuario.rol}
                                            onChange={(event) => {
                                                const nuevoRol = event.target.value as RolUsuario;
                                                if (nuevoRol === usuario.rol) return;

                                                if (nuevoRol === 'usuario' && usuario.ultimo_admin) {
                                                    toast.error('No puedes quitar el rol al último administrador');
                                                    event.target.value = usuario.rol;
                                                    return;
                                                }

                                                if (
                                                    nuevoRol === 'usuario'
                                                    && !window.confirm(`¿Quitar el rol de administrador a ${usuario.nombre_completo || 'este usuario'}?`)
                                                ) {
                                                    event.target.value = usuario.rol;
                                                    return;
                                                }

                                                void handleRolChange(usuario, nuevoRol);
                                            }}
                                            disabled={loadingId === usuario.id || esPropioUsuario || usuario.ultimo_admin}
                                            className={styles.select}
                                            title={
                                                esPropioUsuario
                                                    ? 'No puedes cambiar tu propio rol'
                                                    : usuario.ultimo_admin
                                                        ? 'No puedes quitar el rol al último administrador'
                                                        : undefined
                                            }
                                        >
                                            <option value="usuario">Usuario</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {usuario.ultimo_admin && (
                                            <span className={styles.lastAdmin}>Último admin</span>
                                        )}
                                    </td>
                                    <td>
                                        {suspension ? (
                                            <span className={styles.badgeSuspended}>
                                                Suspendido ({NIVEL_LABELS[suspension.nivel as NivelSuspension] ?? `Nivel ${suspension.nivel}`})
                                            </span>
                                        ) : (
                                            <span className={styles.badgeActive}>Activo</span>
                                        )}
                                    </td>
                                    <td className={styles.dateCell}>{fecha(usuario.created_at)}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                type="button"
                                                className={styles.btnDetail}
                                                onClick={() => setDetalle(usuario)}
                                            >
                                                Detalle
                                            </button>
                                            {suspension ? (
                                                <button
                                                    type="button"
                                                    className={styles.btnLift}
                                                    onClick={() => void handleLevantar(usuario.id)}
                                                    disabled={loadingId === usuario.id}
                                                >
                                                    Levantar
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={styles.btnSuspend}
                                                    onClick={() => abrirSuspension(usuario)}
                                                    disabled={loadingId === usuario.id || esPropioUsuario}
                                                >
                                                    <DynamicIcon name="Ban" size={16} />
                                                    Suspender
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filtrados.length === 0 && (
                    <p className={styles.empty}>No se encontraron usuarios.</p>
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

            {detalle && (
                <div className={styles.modalOverlay} onClick={() => setDetalle(null)}>
                    <div className={`${styles.modal} ${styles.detailModal}`} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.detailHeader}>
                            <div>
                                <h3>{detalle.nombre_completo || 'Sin nombre'}</h3>
                                <p>{detalle.email || 'Sin email registrado'}</p>
                            </div>
                            <button type="button" className={styles.closeBtn} onClick={() => setDetalle(null)}>
                                <DynamicIcon name="X" size={20} />
                            </button>
                        </div>

                        <dl className={styles.detailGrid}>
                            <div><dt>ID</dt><dd className={styles.mono}>{detalle.id}</dd></div>
                            <div><dt>Teléfono</dt><dd>{detalle.telefono || '—'}</dd></div>
                            <div><dt>Tipo</dt><dd><UserBadge tipo={detalle.tipo} /></dd></div>
                            <div><dt>Rol</dt><dd>{detalle.rol === 'admin' ? 'Administrador' : 'Usuario'}</dd></div>
                            <div><dt>Registro</dt><dd>{fecha(detalle.created_at)}</dd></div>
                            <div><dt>Estado</dt><dd>{suspensionActiva(detalle) ? 'Suspendido' : 'Activo'}</dd></div>
                        </dl>

                        <div className={styles.resumenGrid}>
                            <div>
                                <strong>{detalle.propiedades_count ?? '—'}</strong>
                                <span>Propiedades</span>
                            </div>
                            <div>
                                <strong>{detalle.pqrs_count ?? '—'}</strong>
                                <span>PQRS</span>
                            </div>
                            <div>
                                <strong>{detalle.resenas_count ?? '—'}</strong>
                                <span>Reseñas</span>
                            </div>
                        </div>

                        <h4 className={styles.detailSubtitle}>Historial de suspensiones</h4>
                        {(!detalle.suspensiones || detalle.suspensiones.length === 0) ? (
                            <p className={styles.detailEmpty}>Sin suspensiones registradas.</p>
                        ) : (
                            <ul className={styles.suspensionList}>
                                {detalle.suspensiones.map((suspension) => {
                                    const vigente = suspensionEstaVigente(suspension);
                                    return (
                                        <li key={suspension.id}>
                                            <div>
                                                <strong>{NIVEL_LABELS[suspension.nivel as NivelSuspension] ?? `Nivel ${suspension.nivel}`}</strong>
                                                <span>{suspension.motivo || 'Sin motivo registrado'}</span>
                                            </div>
                                            <div className={styles.suspensionMeta}>
                                                <span className={vigente ? styles.badgeSuspended : styles.badgeActive}>
                                                    {vigente ? 'Vigente' : 'Finalizada'}
                                                </span>
                                                <small>
                                                    {suspension.fecha_fin
                                                        ? `Hasta ${fecha(suspension.fecha_fin)}`
                                                        : 'Permanente'}
                                                </small>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {suspendModal && (
                <div className={styles.modalOverlay} onClick={() => setSuspendModal(null)}>
                    <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                        <h3>Suspender a {suspendModal.nombre}</h3>
                        {suspendModal.esAdmin && (
                            <p className={styles.warning}>
                                Este usuario es administrador. La suspensión no le quita el acceso al panel.
                            </p>
                        )}
                        {error && <p className={styles.error}>{error}</p>}
                        <div className={styles.formGroup}>
                            <label>Nivel de suspensión</label>
                            <select
                                value={nivel}
                                onChange={(event) => setNivel(Number(event.target.value) as NivelSuspension)}
                                className={styles.select}
                            >
                                <option value={1}>Nivel 1 — 1 mes</option>
                                <option value={2}>Nivel 2 — 3 meses</option>
                                <option value={3}>Nivel 3 — Ban permanente</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Motivo (opcional)</label>
                            <textarea
                                value={motivo}
                                onChange={(event) => setMotivo(event.target.value)}
                                rows={3}
                                placeholder="Motivo de la suspensión..."
                                className={styles.textarea}
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button type="button" onClick={() => setSuspendModal(null)} className={styles.btnCancel}>
                                Cancelar
                            </button>
                            <button type="button" onClick={() => void handleSuspender()} className={styles.btnConfirm} disabled={!!loadingId}>
                                Confirmar suspensión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
