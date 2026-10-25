'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './NotificacionesPanel.module.css';

interface Notificacion {
    id: number;
    tipo: string;
    titulo: string;
    mensaje: string;
    enlace: string | null;
    leida: boolean;
    created_at: string;
}

export default function NotificacionesPanel() {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        let cancelled = false;

        const cargarNotificaciones = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (cancelled) return;

            if (!user) {
                setError('Debes iniciar sesión para ver tus notificaciones.');
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('notificaciones')
                .select('*')
                .eq('usuario_id', user.id)
                .order('created_at', { ascending: false });

            if (cancelled) return;

            if (fetchError) {
                setError('No se pudieron cargar las notificaciones.');
            } else {
                setNotificaciones(data || []);
            }
            setLoading(false);
        };

        void cargarNotificaciones();
        return () => { cancelled = true; };
    }, [supabase]);

    const marcarLeida = async (id: number) => {
        const { error: updateError } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', id);

        if (!updateError) {
            setNotificaciones((prev) =>
                prev.map((notificacion) =>
                    notificacion.id === id ? { ...notificacion, leida: true } : notificacion
                )
            );
        }
    };

    const marcarTodasLeidas = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error: updateError } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('usuario_id', user.id)
            .eq('leida', false);

        if (!updateError) {
            setNotificaciones((prev) => prev.map((notificacion) => ({ ...notificacion, leida: true })));
        }
    };

    const handleActionClick = async (notificacion: Notificacion) => {
        if (!notificacion.leida) {
            await marcarLeida(notificacion.id);
        }
        if (notificacion.enlace) {
            router.push(notificacion.enlace);
        }
    };

    const formatTime = (dateString: string) => {
        return new Intl.DateTimeFormat('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(dateString));
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.loading}>Cargando notificaciones...</div></div>;
    }

    const hasUnread = notificaciones.some((notificacion) => !notificacion.leida);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Notificaciones</h1>
                    <p className={styles.subtitle}>Avisos de propiedades, PQRS, reseñas y administración.</p>
                </div>
                {hasUnread && (
                    <button className={styles.btnSecundario} onClick={() => void marcarTodasLeidas()}>
                        Marcar todas como leídas
                    </button>
                )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {notificaciones.length === 0 ? (
                <div className={styles.emptyState}>
                    <DynamicIcon name="Bell" size={48} className={styles.emptyIcon} />
                    <h2>No tienes notificaciones</h2>
                    <p>Aquí aparecerán los avisos sobre tus propiedades, reseñas y más.</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {notificaciones.map((notificacion) => (
                        <div
                            key={notificacion.id}
                            className={`${styles.card} ${!notificacion.leida ? styles.cardUnread : ''}`}
                            onClick={() => void handleActionClick(notificacion)}
                        >
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle}>{notificacion.titulo}</h3>
                                    <span className={styles.cardTime}>{formatTime(notificacion.created_at)}</span>
                                </div>
                                <p className={styles.cardMessage}>{notificacion.mensaje}</p>
                            </div>
                            <div className={styles.cardActions}>
                                {!notificacion.leida && (
                                    <button
                                        className={styles.markReadBtn}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void marcarLeida(notificacion.id);
                                        }}
                                        title="Marcar como leída"
                                    >
                                        <DynamicIcon name="Check" size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
