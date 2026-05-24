import DynamicIcon from '@/componentes/ui/DynamicIcon';
import {
    NIVEL_SUSPENSION_LABELS,
    getMensajeSuspension,
    type SuspensionActiva,
} from '@/lib/suspensiones/types';
import Link from 'next/link';
import styles from './SuspensionBanner.module.css';

interface SuspensionBannerProps {
    suspension: SuspensionActiva;
}

export default function SuspensionBanner({ suspension }: SuspensionBannerProps) {
    return (
        <div className={styles.banner} role="alert">
            <div className={styles.iconWrap}>
                <DynamicIcon name="AlertTriangle" size={24} />
            </div>
            <div className={styles.content}>
                <strong>Cuenta suspendida — Nivel {suspension.nivel} ({NIVEL_SUSPENSION_LABELS[suspension.nivel]})</strong>
                <p>{getMensajeSuspension(suspension)}</p>
                {suspension.motivo && (
                    <p className={styles.motivo}>
                        <strong>Motivo:</strong> {suspension.motivo}
                    </p>
                )}
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
