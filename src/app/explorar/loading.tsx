import ExplorarFilters from '@/componentes/explorar/ExplorarFilters/ExplorarFilters';
import TopSearchBar from '@/componentes/explorar/TopSearchBar/TopSearchBar';
import { PropertyGridSkeleton, Skeleton } from '@/componentes/ui/Skeleton/Skeleton';
import styles from './page.module.css';

export default function Loading() {
    return (
        <main className={styles.container} aria-busy="true" aria-live="polite">
            <div className={styles.header}>
                <Skeleton width="18rem" height="2.6rem" />
                <Skeleton width="25rem" height="1.2rem" />
            </div>
            <TopSearchBar />
            <div className={styles.layout}>
                <div className={styles.mainContent}>
                    <PropertyGridSkeleton />
                </div>
                <aside className={styles.sidebar}>
                    <div className={styles.stickyWrapper}>
                        <ExplorarFilters />
                    </div>
                </aside>
            </div>
        </main>
    );
}
