'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './NotificationBell.module.css';

interface Notificacion {
    id: number;
    tipo: string;
    titulo: string;
    mensaje: string;
    enlace: string | null;
    leida: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [noLeidasCount, setNoLeidasCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const supabase = createClient();

    const fetchNotificaciones = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Obtener las últimas 5 para el dropdown
            const { data: ultimas } = await supabase
                .from('notificaciones')
                .select('*')
                .eq('usuario_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (ultimas) {
                setNotificaciones(ultimas);
            }

            // 2. Obtener el conteo real de no leídas
            const { count, error: countError } = await supabase
                .from('notificaciones')
                .select('*', { count: 'exact', head: true })
                .eq('usuario_id', user.id)
                .eq('leida', false);

            if (!countError) {
                setNoLeidasCount(count || 0);
            }
        } catch (error) {
            console.error('Error fetching notificaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const channelRef = useRef<any>(null);

    useEffect(() => {
        fetchNotificaciones();

        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const existing = (supabase as any).getChannels?.()?.find((c: any) => c.topic === `realtime:notificaciones-${user.id}`);
            if (existing || channelRef.current) return;
            const channel = supabase
                .channel(`notificaciones-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notificaciones',
                        filter: `usuario_id=eq.${user.id}`
                    },
                    () => {
                        fetchNotificaciones();
                    }
                )
                .subscribe((status: string) => {
                    if (status === 'CHANNEL_ERROR') console.error('Realtime channel error');
                });
            channelRef.current = channel;
        };

        setupSubscription();
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotificaciones();
        }
    };

    const handleNotificacionClick = async (notificacion: Notificacion) => {
        if (!notificacion.leida) {
            await supabase
                .from('notificaciones')
                .update({ leida: true })
                .eq('id', notificacion.id);
            
            setNotificaciones(prev => 
                prev.map(n => n.id === notificacion.id ? { ...n, leida: true } : n)
            );
            setNoLeidasCount(prev => Math.max(0, prev - 1));
        }

        setIsOpen(false);
        if (notificacion.enlace) {
            router.push(notificacion.enlace);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
        
        if (seconds < 60) return 'Hace un momento';
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return `Hace ${minutes} min`;
        const hours = Math.round(minutes / 60);
        if (hours < 24) return `Hace ${hours} h`;
        const days = Math.round(hours / 24);
        if (days < 30) return `Hace ${days} d`;
        return date.toLocaleDateString();
    };

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button className={styles.bellButton} onClick={toggleDropdown} aria-label="Notificaciones">
                <DynamicIcon name="bell" size={20} />
                {noLeidasCount > 0 && (
                    <span className={styles.badge}>{noLeidasCount > 9 ? '9+' : noLeidasCount}</span>
                )}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.header}>
                        <h3>Notificaciones</h3>
                        {noLeidasCount > 0 && (
                            <Link href="/dashboard/notificaciones" className={styles.markAllRead} onClick={() => setIsOpen(false)}>
                                Ver todas
                            </Link>
                        )}
                    </div>
                    
                    <div className={styles.list}>
                        {loading ? (
                            <div className={styles.empty}>Cargando...</div>
                        ) : notificaciones.length === 0 ? (
                            <div className={styles.empty}>No tienes notificaciones</div>
                        ) : (
                            notificaciones.map(notificacion => (
                                <div 
                                    key={notificacion.id} 
                                    className={`${styles.item} ${!notificacion.leida ? styles.unread : ''}`}
                                    onClick={() => handleNotificacionClick(notificacion)}
                                >
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemHeader}>
                                            <span className={styles.itemTitle}>{notificacion.titulo}</span>
                                            <span className={styles.itemTime}>{formatTimeAgo(notificacion.created_at)}</span>
                                        </div>
                                        <p className={styles.itemMessage}>{notificacion.mensaje}</p>
                                    </div>
                                    {!notificacion.leida && <div className={styles.unreadDot}></div>}
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className={styles.footer}>
                        <Link href="/dashboard/notificaciones" className={styles.viewAll} onClick={() => setIsOpen(false)}>
                            Ver todas las notificaciones
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

