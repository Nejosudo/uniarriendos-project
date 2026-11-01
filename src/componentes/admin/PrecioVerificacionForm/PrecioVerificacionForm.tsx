'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import { actualizarPrecioVerificacion } from '@/app/acciones/configuracionActions';
import styles from '@/app/admin/page.module.css';

interface PrecioVerificacionFormProps {
    valorInicial: number;
}

export default function PrecioVerificacionForm({ valorInicial }: PrecioVerificacionFormProps) {
    const [valor, setValor] = useState(String(valorInicial));
    const [guardado, setGuardado] = useState(valorInicial);
    const [guardando, setGuardando] = useState(false);

    const numero = Number(valor);
    const valido = valor.length > 0 && Number.isInteger(numero) && numero > 0;
    const cambio = valido && numero !== guardado;

    const guardar = async () => {
        if (!valido) {
            toast.error('Ingresa un número entero mayor a cero.');
            return;
        }
        if (numero === guardado || guardando) return;

        setGuardando(true);
        const resultado = await actualizarPrecioVerificacion(numero);
        if (resultado.success) {
            setGuardado(numero);
            toast.success('Precio de verificación actualizado');
        } else {
            toast.error(resultado.error || 'No se pudo actualizar el precio');
        }
        setGuardando(false);
    };

    return (
        <section className={styles.settings}>
            <h2>Ajuste de precio</h2>
            <p className={styles.settingsHint}>Costo de la verificación de propiedad.</p>
            <div className={styles.settingsRow}>
                <div className={styles.settingsField}>
                    <label htmlFor="precio-verificacion">Precio (COP)</label>
                    <input
                        id="precio-verificacion"
                        type="text"
                        inputMode="numeric"
                        maxLength={9}
                        value={valor}
                        onChange={(event) => {
                            setValor(event.target.value.replace(/\D/g, ''));
                        }}
                        onBlur={() => {
                            if (cambio) void guardar();
                        }}
                        className={styles.settingsInput}
                    />
                </div>
                <button
                    type="button"
                    onClick={() => void guardar()}
                    disabled={guardando || !cambio}
                    className={styles.settingsButton}
                >
                    <DynamicIcon name="Check" size={16} />
                    {guardando ? 'Guardando...' : 'Actualizar'}
                </button>
            </div>
            <p className={styles.settingsValue}>
                {valido
                    ? `Valor actual: $${numero.toLocaleString('es-CO')} COP`
                    : 'Solo se permiten números enteros positivos.'}
            </p>
        </section>
    );
}
