'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import { actualizarFeedbackActivo } from '@/app/acciones/configuracionActions';
import styles from './FeedbackToggleForm.module.css';

interface FeedbackToggleFormProps {
    activoInicial: boolean;
}

export default function FeedbackToggleForm({ activoInicial }: FeedbackToggleFormProps) {
    const [activo, setActivo] = useState(activoInicial);
    const [guardando, setGuardando] = useState(false);

    const cambiar = async () => {
        if (guardando) return;

        const nuevoValor = !activo;
        setActivo(nuevoValor);
        setGuardando(true);

        const resultado = await actualizarFeedbackActivo(nuevoValor);
        if (resultado.success) {
            toast.success(nuevoValor ? 'Botón de feedback activado' : 'Botón de feedback desactivado');
        } else {
            setActivo(!nuevoValor);
            toast.error(resultado.error || 'No se pudo actualizar el feedback');
        }
        setGuardando(false);
    };

    return (
        <section className={styles.settings}>
            <h2>Feedback de usuarios</h2>
            <p className={styles.hint}>
                Muestra un botón flotante en todas las páginas para que los usuarios envíen sus comentarios.
            </p>
            <div className={styles.row}>
                <label className={styles.toggle} htmlFor="feedback-activo">
                    <input
                        id="feedback-activo"
                        type="checkbox"
                        role="switch"
                        checked={activo}
                        disabled={guardando}
                        onChange={() => void cambiar()}
                    />
                    <span className={styles.track} aria-hidden="true">
                        <span className={styles.thumb} />
                    </span>
                    <span className={styles.label}>Mostrar botón de feedback</span>
                </label>
                <span className={`${styles.status} ${activo ? styles.statusOn : ''}`}>
                    <DynamicIcon name={activo ? 'CheckCircle' : 'X'} size={14} />
                    {guardando ? 'Guardando...' : activo ? 'Activo' : 'Inactivo'}
                </span>
            </div>
        </section>
    );
}
