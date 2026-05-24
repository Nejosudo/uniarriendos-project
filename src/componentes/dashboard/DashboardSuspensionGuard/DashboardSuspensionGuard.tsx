'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { esRutaDashboardPermitida, getRestricciones } from '@/lib/suspensiones/permissions';
import type { SuspensionActiva } from '@/lib/suspensiones/types';

interface DashboardSuspensionGuardProps {
    suspension: SuspensionActiva;
}

export default function DashboardSuspensionGuard({ suspension }: DashboardSuspensionGuardProps) {
    const pathname = usePathname();
    const router = useRouter();
    const restricciones = getRestricciones(suspension);

    useEffect(() => {
        if (esRutaDashboardPermitida(pathname, restricciones)) return;
        router.replace('/dashboard/perfil');
    }, [pathname, suspension, router]);

    return null;
}
