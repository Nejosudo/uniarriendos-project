import DynamicIcon from '@/componentes/ui/DynamicIcon';
import {
    NIVEL_SUSPENSION_LABELS,
    getMensajeSuspension,
    getRestriccionesResumidas,
    type SuspensionActiva,
} from '@/lib/suspensiones/types';
import Link from 'next/link';
import styles from './SuspensionBanner.module.css';

interface SuspensionBannerProps {
    suspension: SuspensionActiva;
}

export default function SuspensionBanner({ suspension }: SuspensionBannerProps) {
    const nivel = Number(suspension.nivel) as 1 | 2 | 3;
    const restricciones = getRestriccionesResumidas(nivel);

    return (
        <div className={styles.banner} role="alert">
            <div className={styles.iconWrap}>
                <DynamicIcon name="AlertTriangle" size={24} />
            </div>
            <div className={styles.content}>
                <strong>Cuenta suspendida — Nivel {nivel} ({NIVEL_SUSPENSION_LABELS[nivel]})</strong>
                <p>{getMensajeSuspension(suspension)}</p>
                {suspension.motivo && (
                    <p className={styles.motivo}>
                        <strong>Motivo:</strong> {suspension.motivo}
                    </p>
                )}
                <ul className={styles.restricciones}>
                    {restricciones.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
                <p className={styles.hint}>
                    Puedes enviar una{' '}
                    <Link href="/dashboard/pqrs/nueva" className={styles.link}>
                        solicitud PQRS
                    </Link>{' '}
                    si consideras que esto es un error.
                </p>
            </div>
        </div>
    );
}
