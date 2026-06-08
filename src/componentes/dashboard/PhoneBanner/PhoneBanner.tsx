'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './PhoneBanner.module.css';

export default function PhoneBanner() {
    const [hasPhone, setHasPhone] = useState<boolean | null>(null);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const supabase = createClient();

    useEffect(() => {
        const checkPhone = async () => {
            const { data: {user} } = await supabase.auth.getUser();
            if (!user) return;

            const { data: perfil } = await supabase
                .from('perfiles')
                .select('telefono')
                .eq('id', user.id)
                .single();

            setHasPhone(!!perfil?.telefono?.trim());
        };

        checkPhone();
    }, []);

    if (hasPhone === null || !isVisible) {
        return null; // Aún cargando o banner cerrado
    }

    if (hasPhone) {
        return null; // Usuario tiene teléfono, no mostrar banner
    }

    return (
        <div className={styles.banner}>
            <span className={styles.message}>
                Para publicar propiedades, debes registrar un número de teléfono válido en tu perfil.
                Este número se usará para que los interesados puedan contactarte vía WhatsApp.
                Uniarriendos no comparte tu número con terceros, solo lo muestra a los usuarios interesados en tus propiedades. <a href="/terminos">consultar términos y condiciones</a>
            </span>
            <button onClick={() => setIsVisible(false)} className={styles.closeButton}>
                <DynamicIcon name="X" size={20} />
            </button>
        </div>
    );
}