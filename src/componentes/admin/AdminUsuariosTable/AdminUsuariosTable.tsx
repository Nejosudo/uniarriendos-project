'use client';

import { useState } from 'react';
import {
    suspenderUsuario,
    levantarSuspension,
} from '@/app/acciones/suspensionesActions';
import { cambiarRolUsuario } from '@/app/acciones/adminUsuariosActions';
import type { RolUsuario } from '@/lib/suspensiones/types';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import UserBadge from '@/componentes/ui/UserBadge/UserBadge';
import styles from './AdminUsuariosTable.module.css';
import type { NivelSuspension } from '@/lib/suspensiones/types';

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
    telefono: string | null;
    rol: RolUsuario;
    tipo?: string | null;
    created_at: string;
    suspensiones?: Suspension[];
}

interface AdminUsuariosTableProps {
    usuarios: Usuario[];
}

const NIVEL_LABELS: Record<NivelSuspension, string> = {
    1: '1 mes',
    2: '3 meses',
    3: 'Ban permanente',
};

export default function AdminUsuariosTable({ usuarios: initial }: AdminUsuariosTableProps) {
    const [usuarios, setUsuarios] = useState(initial);
    const [busqueda, setBusqueda] = useState('');
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [suspendModal, setSuspendModal] = useState<{ id: string; nombre: string } | null>(null);
    const [nivel, setNivel] = useState<NivelSuspension>(1);
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');

    const filtrados = usuarios.filter((u) => {
        const q = busqueda.toLowerCase();
        return (
            u.nombre_completo?.toLowerCase().includes(q) ||
            u.telefono?.includes(q) ||
            u.id.toLowerCase().includes(q)
        );
    });

    const suspensionActiva = (u: Usuario) =>
        u.suspensiones?.find((s) => s.activa) ?? null;

    const handleRolChange = async (id: string, rol: RolUsuario) => {
        setLoadingId(id);
        const result = await cambiarRolUsuario(id, rol);
        if (result.success) {
            setUsuarios(usuarios.map((u) => (u.id === id ? { ...u, rol } : u)));
        } else {
            alert(result.error);
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
            window.location.reload();
        } else {
            setError(result.error || 'Error al suspender');
        }
        setLoadingId(null);
    };

    const handleLevantar = async (id: string) => {
        if (!confirm('¿Levantar la suspensión de este usuario?')) return;
        setLoadingId(id);
        const result = await levantarSuspension(id);
        if (result.success) {
            window.location.reload();
        } else {
            alert(result.error);
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
                        placeholder="Buscar por nombre, teléfono o ID..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <span className={styles.count}>{filtrados.length} usuarios</span>
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
                        {filtrados.map((u) => {
                            const susp = suspensionActiva(u);
                            return (
                                <tr key={u.id} className={loadingId === u.id ? styles.rowLoading : ''}>
                                    <td>
                                        <div className={styles.userInfo}>
                                            <strong>{u.nombre_completo || 'Sin nombre'}</strong>
                                            <span className={styles.userId}>{u.id.slice(0, 8)}…</span>
                                        </div>
                                    </td>
                                    <td>
                                        <UserBadge tipo={u.tipo} />
                                    </td>
                                    <td>{u.telefono || '—'}</td>
                                    <td>
                                        <select
                                            value={u.rol}
                                            onChange={(e) => handleRolChange(u.id, e.target.value as RolUsuario)}
                                            disabled={loadingId === u.id}
                                            className={styles.select}
                                        >
                                            <option value="usuario">Usuario</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>
                                        {susp ? (
                                            <span className={styles.badgeSuspended}>
                                                Suspendido ({NIVEL_LABELS[susp.nivel as NivelSuspension] ?? `Nivel ${susp.nivel}`})
                                            </span>
                                        ) : (
                                            <span className={styles.badgeActive}>Activo</span>
                                        )}
                                    </td>
                                    <td className={styles.dateCell}>
                                        {new Date(u.created_at).toLocaleDateString('es-CO')}
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            {susp ? (
                                                <button
                                                    type="button"
                                                    className={styles.btnLift}
                                                    onClick={() => handleLevantar(u.id)}
                                                    disabled={loadingId === u.id}
                                                >
                                                    Levantar
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={styles.btnSuspend}
                                                    onClick={() =>
                                                        setSuspendModal({
                                                            id: u.id,
                                                            nombre: u.nombre_completo || 'Usuario',
                                                        })
                                                    }
                                                    disabled={loadingId === u.id}
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

            {suspendModal && (
                <div className={styles.modalOverlay} onClick={() => setSuspendModal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3>Suspender a {suspendModal.nombre}</h3>
                        {error && <p className={styles.error}>{error}</p>}
                        <div className={styles.formGroup}>
                            <label>Nivel de suspensión</label>
                            <select
                                value={nivel}
                                onChange={(e) => setNivel(Number(e.target.value) as NivelSuspension)}
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
                                onChange={(e) => setMotivo(e.target.value)}
                                rows={3}
                                placeholder="Motivo de la suspensión..."
                                className={styles.textarea}
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button type="button" onClick={() => setSuspendModal(null)} className={styles.btnCancel}>
                                Cancelar
                            </button>
                            <button type="button" onClick={handleSuspender} className={styles.btnConfirm} disabled={!!loadingId}>
                                Confirmar suspensión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
