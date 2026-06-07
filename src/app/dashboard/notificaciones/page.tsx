'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './notificaciones.module.css';

export default function NotificacionesPage() {
    const [notificaciones, setNotificaciones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const fetchNotificaciones = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('notificaciones')
                .select('*')
                .eq('usuario_id', user.id)
                .order('created_at', { ascending: false });
            if (data) {
                setNotificaciones(data);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotificaciones();
    }, []);

    const handleMarcarLeida = async (id: number) => {
        await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
        setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    };

    const handleMarcarTodasLeidas = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', user.id).eq('leida', false);
            setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
        }
    };

    const handleActionClick = async (notificacion: any) => {
        if (!notificacion.leida) {
            await handleMarcarLeida(notificacion.id);
        }
        if (notificacion.enlace) {
            router.push(notificacion.enlace);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.loading}>Cargando notificaciones...</div></div>;
    }

    const hasUnread = notificaciones.some(n => !n.leida);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Notificaciones</h1>
                {hasUnread && (
                    <button className={styles.btnSecundario} onClick={handleMarcarTodasLeidas}>
                        Marcar todas como leídas
                    </button>
                )}
            </div>

            {notificaciones.length === 0 ? (
                <div className={styles.emptyState}>
                    <DynamicIcon name="Bell" size={48} className={styles.emptyIcon} />
                    <h2>No tienes notificaciones</h2>
                    <p>Aquí aparecerán los avisos sobre tus propiedades, reseñas y más.</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {notificaciones.map(notificacion => (
                        <div 
                            key={notificacion.id} 
                            className={`${styles.card} ${!notificacion.leida ? styles.cardUnread : ''}`}
                            onClick={() => handleActionClick(notificacion)}
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
                                        onClick={(e) => { e.stopPropagation(); handleMarcarLeida(notificacion.id); }}
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
