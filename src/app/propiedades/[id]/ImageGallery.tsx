'use client';
import { useState } from 'react';
import styles from './ImageGallery.module.css';

interface Props {
    fotos: string[];
}

export default function ImageGallery({ fotos }: Props) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);

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
        if (fotos.length === 1) {
            return (
                <div className={styles.singleImage} onClick={() => openLightbox(0)}>
                    <img src={fotos[0]} alt="Propiedad" />
                </div>
            );
        }

        if (fotos.length >= 5) {
            return (
                <div className={styles.mosaic}>
                    <div className={styles.mainPhoto} onClick={() => openLightbox(0)}>
                        <img src={fotos[0]} alt="Principal" />
                    </div>
                    <div className={styles.sidePhotos}>
                        {fotos.slice(1, 5).map((foto, idx) => (
                            <div key={idx} className={styles.smallPhoto} onClick={() => openLightbox(idx + 1)}>
                                <img src={foto} alt={`Foto ${idx + 1}`} />
                                {idx === 3 && fotos.length > 5 && (
                                    <div className={styles.morePhotosOverlay}>+{fotos.length - 5} fotos</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Si son de 2 a 4 fotos -> Carrusel simple
        return (
            <div className={styles.carouselContainer}>
                <div className={styles.carouselScroll}>
                    {fotos.map((foto, idx) => (
                        <div key={idx} className={styles.carouselSlide} onClick={() => openLightbox(idx)}>
                            <img src={foto} alt={`Foto ${idx}`} />
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
                <div className={styles.lightbox} onClick={closeLightbox}>
                    <button className={styles.closeBtn} onClick={closeLightbox}>✕</button>
                    
                    {fotos.length > 1 && (
                        <button className={styles.navBtnLeft} onClick={prevImage}>‹</button>
                    )}
                    
                    <img 
                        src={fotos[currentImage]} 
                        alt="Vista ampliada" 
                        className={styles.lightboxImage} 
                        onClick={(e) => e.stopPropagation()} 
                    />
                    
                    {fotos.length > 1 && (
                        <button className={styles.navBtnRight} onClick={nextImage}>›</button>
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
