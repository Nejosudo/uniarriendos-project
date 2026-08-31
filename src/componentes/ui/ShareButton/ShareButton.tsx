'use client';
import { useState } from 'react';
import styles from './ShareButton.module.css';

export default function ShareButton() {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;
        
        // El API de Share solo funciona en contextos seguros (HTTPS) o localhost
        // Si estamos por IP (ej: 192.168...) navigator.share será undefined
        if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
            try {
                await navigator.share({
                    title: '¡Mira esta propiedad en UniArriendos!',
                    url: url,
                });
                return;
            } catch (error) {
                console.log('Compartir cancelado o error en API nativa', error);
                // Si falla o cancela, intentamos copiar
            }
        }
        
        // Fallback: Copiar al portapapeles
        copyToClipboard(url);
    };

    const copyToClipboard = async (text: string) => {
        // Intento con Clipboard API (Solo contextos seguros)
        if (navigator.clipboard && typeof window !== 'undefined' && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                showCopied();
                return;
            } catch (err) {
                console.error('Error con Clipboard API:', err);
            }
        }

        // Fallback definitivo: Textarea temporal (Funciona en HTTP/IP)
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Estilos para que no se vea pero sea seleccionable
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCopied();
            } else {
                console.error('execCommand copy no fue exitoso');
            }
        } catch (err) {
            console.error('Error en fallback manual:', err);
        }
        
        document.body.removeChild(textArea);
    };

    const showCopied = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button onClick={handleShare} className={styles.shareBtn} title="Compartir propiedad" aria-label="Compartir propiedad">
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
