import type { TipoUsuario } from '@/lib/usuarios/tipoUsuario';
import styles from './UserBadge.module.css';

const LABELS: Record<TipoUsuario, string> = {
    unipaz: 'UNIPAZ',
    externo: 'EXTERNO',
};

interface UserBadgeProps {
    tipo: TipoUsuario | string | null | undefined;
    className?: string;
}

export default function UserBadge({ tipo, className }: UserBadgeProps) {
    if (tipo !== 'unipaz' && tipo !== 'externo') {
        return null;
    }

    return (
        <span
            className={`${styles.badge} ${styles[tipo]} ${className ?? ''}`}
            title={tipo === 'unipaz' ? 'Usuario con correo @unipaz.edu.co' : 'Usuario externo a UNIPAZ'}
        >
            {LABELS[tipo]}
        </span>
    );
}
