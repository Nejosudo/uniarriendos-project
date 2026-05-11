'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { cambiarEstadoPropiedad, eliminarPropiedad } from '@/app/acciones/propiedadesDashboardActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './PropertiesTable.module.css';

interface PropertiesTableProps {
    propiedades: any[];
}

export default function PropertiesTable({ propiedades: initialPropiedades }: PropertiesTableProps) {
    const [propiedades, setPropiedades] = useState(initialPropiedades);
    const [isLoading, setIsLoading] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    
    // Estados para el modal de borrado
    const [deleteModal, setDeleteModal] = useState<{show: boolean, id: number | null, titulo: string}>({
        show: false,
        id: null,
        titulo: ''
    });
    const [password, setPassword] = useState('');
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleEstadoChange = async (id: number, nuevoEstado: string) => {
        setIsLoading(id);
        const result = await cambiarEstadoPropiedad(id, nuevoEstado);
        
        if (result.success) {
            setPropiedades(propiedades.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
        } else {
            alert(result.error);
        }
        setIsLoading(null);
    };

    const openDeleteModal = (id: number, titulo: string) => {
        setDeleteModal({ show: true, id, titulo });
        setPassword('');
        setDeleteError('');
    };

    const handleConfirmDelete = async () => {
        if (!password) {
            setDeleteError('La contraseña es obligatoria.');
            return;
        }

        setIsLoading(deleteModal.id);
        setDeleteError('');
        
        const result = await eliminarPropiedad(deleteModal.id!, password);
        
        if (result.success) {
            setPropiedades(propiedades.filter(p => p.id !== deleteModal.id));
            setDeleteModal({ show: false, id: null, titulo: '' });
        } else {
            setDeleteError(result.error || 'Error desconocido');
        }
        setIsLoading(null);
    };

    if (propiedades.length === 0) {
        return (
            <div className={styles.emptyState}>
                <DynamicIcon name="Home" size={48} className={styles.emptyIcon} />
                <h2>No has publicado ninguna propiedad</h2>
                <p>Comienza a recibir ingresos alquilando tu espacio a estudiantes de la UNIPAZ.</p>
                <Link href="/dashboard/propiedades/crear" className={styles.createBtn}>
                    Publicar mi primera propiedad
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Propiedad</th>
                        <th>Precio</th>
                        <th>Estado</th>
                        <th>Métricas</th>
                        <th className={styles.actionsHeader}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {propiedades.map(prop => {
                        const fotos = prop.propiedades_fotos || [];
                        const imgUrl = fotos.length > 0 ? fotos[0].url : null;
                        
                        return (
                            <tr key={prop.id} className={isLoading === prop.id && !deleteModal.show ? styles.rowLoading : ''}>
                                <td>
                                    <div className={styles.propInfo}>
                                        <div className={styles.imgWrapper}>
                                            {imgUrl ? (
                                                <img src={imgUrl} alt={prop.titulo} />
                                            ) : (
                                                <div className={styles.imgPlaceholder}><DynamicIcon name="Image" size={16}/></div>
                                            )}
                                        </div>
                                        <div className={styles.propDetails}>
                                            <h4>{prop.titulo}</h4>
                                            <span className={styles.location}>{prop.ubicacion_texto}</span>
                                            {prop.prioridad === 'recomendada' && (
                                                <span className={styles.badgeRecomendada}>Destacada</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.priceCell}>
                                    ${prop.precio.toLocaleString('es-CO')}
                                </td>
                                <td>
                                    <select 
                                        className={`${styles.statusSelect} ${styles[`status_${prop.estado}`]}`}
                                        value={prop.estado}
                                        onChange={(e) => handleEstadoChange(prop.id, e.target.value)}
                                        disabled={isLoading === prop.id}
                                    >
                                        <option value="disponible">Disponible</option>
                                        <option value="ocupado">Ocupado</option>
                                        <option value="inactivo">Oculto</option>
                                    </select>
                                </td>
                                <td>
                                    <div className={styles.metrics}>
                                        <span title="Favoritos guardados"><DynamicIcon name="Heart" size={14}/> {prop.favoritos_count?.[0]?.count || 0}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.actions}>
                                        <Link href={`/propiedades/${prop.id}`} target="_blank" className={styles.actionBtn} title="Ver pública">
                                            <DynamicIcon name="ExternalLink" size={18} />
                                        </Link>
                                        <Link href={`/dashboard/propiedades/${prop.id}/editar`} className={styles.actionBtn} title="Editar">
                                            <DynamicIcon name="Edit" size={18} />
                                        </Link>
                                        <button 
                                            className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                                            title="Eliminar"
                                            onClick={() => openDeleteModal(prop.id, prop.titulo)}
                                            disabled={isLoading === prop.id}
                                        >
                                            <DynamicIcon name="Trash2" size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {mounted && deleteModal.show && createPortal(
                <div className={styles.modalOverlay} onClick={() => setDeleteModal({ ...deleteModal, show: false })}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.warningIcon}>
                                <DynamicIcon name="AlertTriangle" size={24} />
                            </div>
                            <h3>Eliminar Propiedad</h3>
                            <button className={styles.closeBtn} onClick={() => setDeleteModal({ ...deleteModal, show: false })}>
                                <DynamicIcon name="X" size={20} />
                            </button>
                        </div>
                        
                        <div className={styles.modalBody}>
                            <p className={styles.warningText}>
                                ¿Estás seguro de que deseas eliminar <strong>"{deleteModal.titulo}"</strong>?
                            </p>
                            <p className={styles.infoText}>
                                Esta acción es permanente y no se puede deshacer. Se eliminarán todas las fotos y registros asociados.
                            </p>

                            <div className={styles.inputGroup}>
                                <label htmlFor="delete-password">Confirma tu contraseña para continuar:</label>
                                <input 
                                    type="password" 
                                    id="delete-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Tu contraseña"
                                    className={deleteError ? styles.inputError : ''}
                                    autoFocus
                                />
                                {deleteError && <span className={styles.errorMessage}>{deleteError}</span>}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button 
                                className={styles.cancelBtn} 
                                onClick={() => setDeleteModal({ ...deleteModal, show: false })}
                                disabled={isLoading !== null}
                            >
                                Cancelar
                            </button>
                            <button 
                                className={styles.confirmDeleteBtn}
                                onClick={handleConfirmDelete}
                                disabled={isLoading !== null}
                            >
                                {isLoading === deleteModal.id ? 'Eliminando...' : 'Eliminar Permanentemente'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
