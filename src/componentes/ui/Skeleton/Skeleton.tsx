import styles from './Skeleton.module.css';

type SkeletonProps = {
    className?: string;
    width?: string;
    height?: string;
};

export function Skeleton({ className = '', width, height }: SkeletonProps) {
    return (
        <span
            aria-hidden="true"
            className={`${styles.skeleton} ${className}`}
            style={{ width, height }}
        />
    );
}

export function PropertyCardSkeleton() {
    return (
        <article className={styles.propertyCard} aria-hidden="true">
            <Skeleton className={styles.propertyImage} />
            <div className={styles.propertyContent}>
                <div className={styles.hostRow}>
                    <Skeleton className={styles.avatar} />
                    <Skeleton className={styles.hostName} />
                </div>
                <Skeleton className={styles.propertyTitle} />
                <Skeleton className={styles.propertyTitleShort} />
                <Skeleton className={styles.propertyLocation} />
                <div className={styles.propertyFooter}>
                    <Skeleton className={styles.propertyPrice} />
                    <Skeleton className={styles.propertyTag} />
                </div>
            </div>
        </article>
    );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className={styles.propertyGrid} aria-label="Cargando propiedades" aria-busy="true">
            {Array.from({ length: count }, (_, index) => (
                <PropertyCardSkeleton key={index} />
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className={styles.table} aria-label="Cargando datos" aria-busy="true">
            <div className={styles.tableHeader}>
                {Array.from({ length: columns }, (_, index) => (
                    <Skeleton key={index} className={styles.tableHeaderCell} />
                ))}
            </div>
            {Array.from({ length: rows }, (_, rowIndex) => (
                <div className={styles.tableRow} key={rowIndex}>
                    {Array.from({ length: columns }, (_, columnIndex) => (
                        <Skeleton
                            key={columnIndex}
                            className={columnIndex === columns - 1 ? styles.tableActionCell : styles.tableCell}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
