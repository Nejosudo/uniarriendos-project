import { getSuspensionForLayout } from '@/lib/suspensiones/guard';
import SuspensionBanner from '@/componentes/dashboard/SuspensionBanner/SuspensionBanner';
import styles from './GlobalSuspensionBanner.module.css';

export const dynamic = 'force-dynamic';

export default async function GlobalSuspensionBanner() {
    const suspension = await getSuspensionForLayout();
    if (!suspension) return null;

    return (
        <div className={styles.wrapper}>
            <SuspensionBanner suspension={suspension} />
        </div>
    );
}
