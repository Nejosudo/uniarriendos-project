'use client';
import Image from 'next/image';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { crearResena, type ResenaConUsuario } from '@/app/acciones/resenasActions';
import { calcularPromedioResenas, formatearEstrellas } from '@/lib/resenas/utils';
import styles from './ResenasSection.module.css';

interface ResenasSectionProps {
    propiedadId: number;
    resenasIniciales: ResenaConUsuario[];
    puedeInteractuar: boolean;
    isLoggedIn: boolean;
    yaReseno: boolean;
}

export default function ResenasSection({
    propiedadId,
    resenasIniciales,
    puedeInteractuar,
    isLoggedIn,
    yaReseno: yaResenoInicial,
}: ResenasSectionProps) {
    const router = useRouter();
    const [resenas] = useState(resenasIniciales);
    const [calificacion, setCalificacion] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comentario, setComentario] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [yaReseno, setYaReseno] = useState(yaResenoInicial);
    const [isPending, startTransition] = useTransition();

    const resumen = calcularPromedioResenas(resenas);
    const visibles = resenas.filter((r) => !r.reportada);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (calificacion < 1) {
            setError('Selecciona una calificación de 1 a 5 estrellas.');
            return;
        }

        startTransition(async () => {
            const result = await crearResena(propiedadId, calificacion, comentario);

            if (result.success) {
                setSuccess(true);
                setYaReseno(true);
                setComentario('');
                setCalificacion(0);
                router.refresh();
            } else {
                setError(result.error || 'No se pudo publicar la reseña.');
            }
        });
    };

    return (
        <section className={styles.container}>
            <h2>Reseñas de otros usuarios</h2>

            {resumen && (
                <div className={styles.summary}>
                    <span className={styles.summaryStars}>{formatearEstrellas(resumen.promedio)}</span>
                    <span className={styles.summaryText}>
                        <strong>{resumen.promedio}</strong> · {resumen.total}{' '}
                        {resumen.total === 1 ? 'reseña' : 'reseñas'}
                    </span>
                </div>
            )}

            {visibles.length > 0 ? (
                <div className={styles.reviewsList}>
                    {visibles.map((res) => (
                        <article key={res.id} className={styles.reviewItem}>
                            <div className={styles.reviewHeader}>
                                {res.usuario?.avatar_url ? (
                                    <Image
                                        src={res.usuario.avatar_url}
                                        alt={res.usuario.nombre_completo || 'Usuario'}
                                        width={40} height={40}
                                        className={styles.reviewAvatar}
                                    />
                                ) : (
                                    <div className={styles.reviewAvatarDefault}>
                                        {res.usuario?.nombre_completo?.charAt(0) || '?'}
                                    </div>
                                )}
                                <div>
                                    <p className={styles.reviewUser}>
                                        {res.usuario?.nombre_completo || 'Usuario'}
                                    </p>
                                    <p className={styles.reviewDate}>
                                        {new Date(res.created_at).toLocaleDateString('es-CO', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div className={styles.stars}>{formatearEstrellas(res.calificacion)}</div>
                            </div>
                            <p className={styles.reviewComment}>{res.comentario}</p>
                        </article>
                    ))}
                </div>
            ) : (
                <p className={styles.emptyMsg}>Aún no hay reseñas para esta propiedad.</p>
            )}

            {puedeInteractuar && !yaReseno ? (
                <form className={styles.addReview} onSubmit={handleSubmit}>
                    <h3>Añadir una reseña</h3>
                    {error && <div className={styles.errorAlert}>{error}</div>}
                    {success && (
                        <div className={styles.successMsg}>
                            ¡Gracias! Tu reseña se publicó correctamente.
                        </div>
                    )}
                    <div className={styles.ratingPicker}>
                        <span className={styles.ratingLabel}>Tu calificación:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`${styles.starBtn} ${
                                    star <= (hoverRating || calificacion) ? styles.starBtnActive : ''
                                }`}
                                onClick={() => setCalificacion(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                aria-label={`${star} estrellas`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    <textarea
                        placeholder="Cuéntanos tu experiencia..."
                        className={styles.textarea}
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        maxLength={1000}
                        required
                        minLength={10}
                    />
                    <button type="submit" className={styles.btnPrimary} disabled={isPending}>
                        {isPending ? 'Publicando...' : 'Publicar Reseña'}
                    </button>
                </form>
            ) : puedeInteractuar && yaReseno ? (
                <p className={styles.alreadyReviewed}>
                    Ya publicaste una reseña para esta propiedad.
                </p>
            ) : isLoggedIn ? (
                <div className={styles.authPrompt}>
                    <p>Tu cuenta está suspendida y no puedes dejar reseñas.</p>
                    <Link href="/dashboard/pqrs/nueva" className={styles.btnOutline}>
                        Apelar suspensión (PQRS)
                    </Link>
                </div>
            ) : (
                <div className={styles.authPrompt}>
                    <p>Inicia sesión para dejar una reseña.</p>
                    <Link href="/login" className={styles.btnOutline}>
                        Iniciar Sesión
                    </Link>
                </div>
            )}
        </section>
    );
}
