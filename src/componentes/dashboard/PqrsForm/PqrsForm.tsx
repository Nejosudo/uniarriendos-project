'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearPqrs, PqrsTipo } from '@/app/acciones/pqrsActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './PqrsForm.module.css';

const TIPOS: { value: PqrsTipo; label: string; description: string; icon: string }[] = [
    { value: 'peticion', label: 'Petición', description: 'Solicitud de información o servicio', icon: 'HelpCircle' },
    { value: 'queja', label: 'Queja', description: 'Insatisfacción con un servicio o proceso', icon: 'MessageSquare' },
    { value: 'reclamo', label: 'Reclamo', description: 'Problema que requiere solución formal', icon: 'AlertTriangle' },
    { value: 'sugerencia', label: 'Sugerencia', description: 'Idea para mejorar la plataforma', icon: 'Lightbulb' },
];

export default function PqrsForm() {
    const router = useRouter();
    const [tipo, setTipo] = useState<PqrsTipo>('peticion');
    const [asunto, setAsunto] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const result = await crearPqrs({ tipo, asunto, mensaje });

        if (result.success) {
            router.push('/dashboard/pqrs');
        } else {
            setError(result.error || 'Error al enviar la solicitud');
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorAlert}>{error}</div>}

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Tipo de solicitud</h2>
                <div className={styles.tipoGrid}>
                    {TIPOS.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            className={`${styles.tipoCard} ${tipo === t.value ? styles.tipoCardSelected : ''}`}
                            onClick={() => setTipo(t.value)}
                        >
                            <DynamicIcon name={t.icon} size={24} />
                            <span className={styles.tipoLabel}>{t.label}</span>
                            <span className={styles.tipoDesc}>{t.description}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.formGroup}>
                    <label htmlFor="asunto">Asunto *</label>
                    <input
                        id="asunto"
                        type="text"
                        required
                        minLength={5}
                        maxLength={150}
                        placeholder="Resume brevemente tu solicitud"
                        value={asunto}
                        onChange={(e) => setAsunto(e.target.value)}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="mensaje">Mensaje *</label>
                    <textarea
                        id="mensaje"
                        required
                        minLength={20}
                        maxLength={2000}
                        rows={6}
                        placeholder="Describe con detalle tu petición, queja, reclamo o sugerencia..."
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        className={styles.textarea}
                    />
                    <span className={styles.charCount}>{mensaje.length}/2000</span>
                </div>
            </section>

            <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <div className={styles.spinner} />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <DynamicIcon name="Send" size={18} />
                            Enviar Solicitud
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
