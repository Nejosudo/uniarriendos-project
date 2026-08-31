import { PropertyGridSkeleton, Skeleton } from '@/componentes/ui/Skeleton/Skeleton';
import styles from './page.module.css';

export default function Loading() {
  return (
    <main className={styles.main} aria-busy="true" aria-live="polite">
      <div className={styles.hero}>
        <Skeleton width="28rem" height="3rem" />
        <Skeleton width="36rem" height="1.2rem" />
      </div>
      <div className={styles.container} style={{ paddingTop: '2rem' }}>
        <PropertyGridSkeleton count={6} />
      </div>
    </main>
  );
}
