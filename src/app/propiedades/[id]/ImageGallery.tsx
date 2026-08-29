'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ImageGallery.module.css';

interface Props {
    fotos: string[];
}

export default function ImageGallery({ fotos }: Props) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxOpen(false);
            if (e.key === 'ArrowRight') setCurrentImage(v => (v + 1) % fotos.length);
            if (e.key === 'ArrowLeft') setCurrentImage(v => v === 0 ? fotos.length - 1 : v - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxOpen, fotos.length]);

    if (!fotos || fotos.length === 0) {
        return (
            <div className={styles.noPhotos}>
                <p>No hay fotos disponibles para esta propiedad</p>
            </div>
        );
    }

    const openLightbox = (index: number) => {
        setCurrentImage(index);
        setLightboxOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        document.body.style.overflow = 'auto';
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImage((prev) => (prev + 1) % fotos.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImage((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));
    };

    const renderGallery = () => {
        const count = fotos.length;

        if (count === 1) {
            return (
                <div className={styles.singleImage} onClick={() => openLightbox(0)}>
                    <Image src={fotos[0]} alt="Propiedad - foto 1 de 1" fill sizes="100vw" style={{ objectFit: 'cover' }} />
                </div>
            );
        }

        return (
            <div className={`${styles.mosaic} ${styles[`mosaic${Math.min(count, 5)}`]}`}>
                <div className={styles.mainPhoto} onClick={() => openLightbox(0)}>
                    <Image src={fotos[0]} alt="Propiedad - foto principal" fill sizes="60vw" style={{ objectFit: 'cover' }} priority />
                </div>
                <div className={styles.sidePhotos}>
                    {fotos.slice(1, 5).map((foto, idx) => (
                        <div key={idx} className={styles.smallPhoto} onClick={() => openLightbox(idx + 1)}>
                            <Image src={foto} alt={`Propiedad - foto ${idx + 2} de ${fotos.length}`} fill sizes="20vw" style={{ objectFit: 'cover' }} />
                            {idx === 3 && count > 5 && (
                                <div className={styles.morePhotosOverlay}>+{count - 5} fotos</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className={styles.galleryWrapper}>
                {renderGallery()}
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && (
                <div className={styles.lightbox} onClick={closeLightbox} role="dialog" aria-modal="true" aria-label="Galería ampliada">
                    <button className={styles.closeBtn} onClick={closeLightbox} aria-label="Cerrar galería">✕</button>
                    
                    {fotos.length > 1 && (
                        <button className={styles.navBtnLeft} onClick={prevImage} aria-label="Foto anterior">‹</button>
                    )}
                    
                    <Image 
                        src={fotos[currentImage]} 
                        alt={`Vista ampliada ${currentImage + 1} de ${fotos.length}`} 
                        width={1200} height={800}
                        className={styles.lightboxImage} 
                        onClick={(e) => e.stopPropagation()} 
                        style={{ width: 'auto', height: 'auto', maxWidth: '90vw', maxHeight: '90vh' }}
                    />
                    
                    {fotos.length > 1 && (
                        <button className={styles.navBtnRight} onClick={nextImage} aria-label="Foto siguiente">›</button>
                    )}
                    
                    {fotos.length > 1 && (
                        <div className={styles.counter}>
                            {currentImage + 1} / {fotos.length}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
