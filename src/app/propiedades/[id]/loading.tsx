import { Skeleton } from '@/componentes/ui/Skeleton/Skeleton';
import styles from './page.module.css';

export default function Loading() {
    return (
        <main className={styles.container} aria-busy="true" aria-live="polite">
            <header className={styles.header}>
                <div className={styles.titleRow}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: 'min(100%, 42rem)' }}>
                        <Skeleton width="80%" height="2.6rem" />
                        <Skeleton width="45%" height="1.1rem" />
                    </div>
                </div>
            </header>
            <Skeleton width="100%" height="min(52vw, 30rem)" />
            <div className={styles.contentGrid}>
                <div className={styles.mainInfo}>
                    <Skeleton width="32%" height="1.4rem" />
                    <section className={styles.section}>
                        <Skeleton width="16rem" height="1.5rem" />
                        <Skeleton width="100%" height="1rem" />
                        <Skeleton width="92%" height="1rem" />
                        <Skeleton width="68%" height="1rem" />
                    </section>
                    <section className={styles.section}>
                        <Skeleton width="13rem" height="1.5rem" />
                        <Skeleton width="100%" height="8rem" />
                    </section>
                </div>
                <aside className={styles.sidebar}>
                    <Skeleton width="100%" height="16rem" />
                </aside>
            </div>
        </main>
    );
}
