'use client';

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toggleFavorito } from '@/app/acciones/favoritosActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import toast from 'react-hot-toast';
import styles from './FavoriteButton.module.css';

interface FavoriteButtonProps {
    propiedadId: string;
    initialIsFavorite: boolean;
    className?: string;
    variant?: 'icon' | 'labeled';
    disabled?: boolean;
    disabledReason?: string;
}

export default function FavoriteButton({ 
    propiedadId, 
    initialIsFavorite, 
    className = '',
    variant = 'icon',
    disabled = false,
    disabledReason = 'No puedes usar favoritos con tu cuenta suspendida.',
}: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isPending, startTransition] = useTransition();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (disabled) {
            toast.error(disabledReason);
            return;
        }

        // Optimistic UI update
        setIsFavorite(!isFavorite);

        startTransition(async () => {
            const result = await toggleFavorito(propiedadId);
            if (result.error) {
                // Revertir si hay error
                setIsFavorite(isFavorite);
                if (result.error.includes('iniciar sesión')) {
                    setShowAuthModal(true);
                } else {
                    toast.error(result.error || 'No se pudo actualizar favoritos');
                }
            } else if (result.success !== undefined) {
                setIsFavorite(result.isFavorite);
                toast.success(result.isFavorite ? 'Añadido a favoritos' : 'Eliminado de favoritos');
            }
        });
    };

    const AuthModal = () => {
        if (!mounted || !showAuthModal) return null;
        
        return createPortal(
            <div className={styles.modalOverlay} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAuthModal(false); }}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3>Inicia sesión</h3>
                        <button onClick={(e) => { e.preventDefault(); setShowAuthModal(false); }} className={styles.closeBtn}>
                            <DynamicIcon name="X" size={20} />
                        </button>
                    </div>
                    <div className={styles.modalBody}>
                        <p>Debes tener una cuenta para poder marcar propiedades como favoritas y guardarlas para más tarde.</p>
                        <div className={styles.modalActions}>
                            <a href="/login" className={styles.modalBtnPrimary}>Iniciar Sesión</a>
                            <a href="/registro" className={styles.modalBtnOutline}>Registrarse</a>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    if (variant === 'labeled') {
        return (
            <>
                <button 
                    onClick={handleToggle} 
                    className={`${styles.labeledBtn} ${isFavorite ? styles.favorited : ''} ${className}`}
                    disabled={isPending || disabled}
                    title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                >
                    <DynamicIcon name="Heart" size={20} className={isFavorite ? styles.iconFilled : styles.iconOutline} />
                    <span>{isFavorite ? 'Guardado' : 'Guardar'}</span>
                </button>
                <AuthModal />
            </>
        );
    }

    return (
        <>
            <button 
                onClick={handleToggle} 
                className={`${styles.iconBtn} ${className}`}
                disabled={isPending || disabled}
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
                <DynamicIcon 
                    name="Heart" 
                    size={22} 
                    className={isFavorite ? styles.iconFilled : styles.iconOutline} 
                />
            </button>
            <AuthModal />
        </>
    );
}
