import { Skeleton, TableSkeleton } from '@/componentes/ui/Skeleton/Skeleton';
import styles from './dashboard.module.css';

export default function Loading() {
    return (
        <div className={styles.mainContent} aria-busy="true" aria-live="polite">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                <Skeleton width="14rem" height="2.2rem" />
                <Skeleton width="24rem" height="1rem" />
            </div>
            <TableSkeleton />
        </div>
    );
}
