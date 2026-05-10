'use client';
import { useState } from 'react';
import styles from './ShareButton.module.css';

export default function ShareButton() {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '¡Mira esta propiedad en UniArriendos!',
                    url: url,
                });
            } catch (error) {
                console.log('Compartir cancelado o no soportado', error);
            }
        } else {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button onClick={handleShare} className={styles.shareBtn} title="Compartir propiedad">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
        </button>
    );
}
