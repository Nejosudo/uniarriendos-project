'use client';
import Image from 'next/image';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    crearPregunta,
    responderPregunta,
    type PreguntaConUsuario,
} from '@/app/acciones/preguntasActions';
import styles from './PreguntasSection.module.css';

interface PreguntasSectionProps {
    propiedadId: number;
    preguntasIniciales: PreguntaConUsuario[];
    puedeInteractuar: boolean;
    isLoggedIn: boolean;
    esAnfitrion: boolean;
}

function formatFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function UserAvatar({
    nombre,
    avatarUrl,
}: {
    nombre: string | null | undefined;
    avatarUrl: string | null | undefined;
}) {
    if (avatarUrl) {
        return (
            <Image src={avatarUrl} alt={nombre || 'Usuario'} width={40} height={40} className={styles.qaAvatar} />
        );
    }

    return (
        <div className={styles.qaAvatarDefault}>
            {nombre?.charAt(0) || '?'}
        </div>
    );
}

function ReplyForm({ preguntaId }: { preguntaId: number }) {
    const router = useRouter();
    const [respuesta, setRespuesta] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        startTransition(async () => {
            const result = await responderPregunta(preguntaId, respuesta);

            if (result.success) {
                setSuccess(true);
                setRespuesta('');
                router.refresh();
            } else {
                setError(result.error || 'No se pudo publicar la respuesta.');
            }
        });
    };

    return (
        <form className={styles.replyForm} onSubmit={handleSubmit}>
            <h4>Responder como anfitrión</h4>
            {error && <div className={styles.errorAlert}>{error}</div>}
            {success && (
                <div className={styles.successMsg}>
                    Respuesta publicada correctamente.
                </div>
            )}
            <textarea
                placeholder="Escribe tu respuesta..."
                className={styles.textarea}
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                maxLength={1000}
                required
                minLength={5}
            />
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
                {isPending ? 'Publicando...' : 'Publicar Respuesta'}
            </button>
        </form>
    );
}

export default function PreguntasSection({
    propiedadId,
    preguntasIniciales,
    puedeInteractuar,
    isLoggedIn,
    esAnfitrion,
}: PreguntasSectionProps) {
    const router = useRouter();
    const [pregunta, setPregunta] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    const puedePreguntar = puedeInteractuar && !esAnfitrion;
    const preguntasPendientes = preguntasIniciales.filter((p) => !p.respuesta).length;

    const handleSubmitPregunta = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        startTransition(async () => {
            const result = await crearPregunta(propiedadId, pregunta);

            if (result.success) {
                setSuccess(true);
                setPregunta('');
                router.refresh();
            } else {
                setError(result.error || 'No se pudo enviar la pregunta.');
            }
        });
    };

    return (
        <div className={styles.container}>
            {preguntasIniciales.length > 0 ? (
                <div className={styles.qaList}>
                    {preguntasIniciales.map((item) => (
                        <article key={item.id} className={styles.qaItem}>
                            <div className={styles.qaHeader}>
                                <UserAvatar
                                    nombre={item.usuario?.nombre_completo}
                                    avatarUrl={item.usuario?.avatar_url}
                                />
                                <div>
                                    <p className={styles.qaUser}>
                                        {item.usuario?.nombre_completo || 'Usuario'}
                                    </p>
                                    <p className={styles.qaDate}>
                                        {formatFecha(item.created_at)}
                                    </p>
                                </div>
                            </div>
                            <p className={styles.qaQuestion}>{item.pregunta}</p>

                            {item.respuesta ? (
                                <div className={styles.qaAnswer}>
                                    <p className={styles.qaAnswerLabel}>Respuesta del anfitrión</p>
                                    <p className={styles.qaAnswerText}>{item.respuesta}</p>
                                    {item.responded_at && (
                                        <p className={styles.qaDate}>
                                            {formatFecha(item.responded_at)}
                                        </p>
                                    )}
                                </div>
                            ) : esAnfitrion ? (
                                <ReplyForm preguntaId={item.id} />
                            ) : (
                                <p className={styles.qaPending}>
                                    El anfitrión aún no ha respondido.
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            ) : (
                <p className={styles.emptyMsg}>
                    Aún no hay preguntas. ¡Sé el primero en preguntar!
                </p>
            )}

            {puedePreguntar ? (
                <form className={styles.askForm} onSubmit={handleSubmitPregunta}>
                    <h3>Hacer una pregunta</h3>
                    {error && <div className={styles.errorAlert}>{error}</div>}
                    {success && (
                        <div className={styles.successMsg}>
                            Tu pregunta se envió correctamente.
                        </div>
                    )}
                    <textarea
                        placeholder="Escribe tu pregunta aquí..."
                        className={styles.textarea}
                        value={pregunta}
                        onChange={(e) => setPregunta(e.target.value)}
                        maxLength={500}
                        required
                        minLength={10}
                    />
                    <button type="submit" className={styles.btnPrimary} disabled={isPending}>
                        {isPending ? 'Enviando...' : 'Enviar Pregunta'}
                    </button>
                </form>
            ) : esAnfitrion ? (
                <p className={styles.hostNotice}>
                    {preguntasPendientes > 0
                        ? `Tienes ${preguntasPendientes} pregunta${preguntasPendientes === 1 ? '' : 's'} pendiente${preguntasPendientes === 1 ? '' : 's'} por responder.`
                        : 'Eres el anfitrión de esta propiedad. Los visitantes pueden hacerte preguntas aquí.'}
                </p>
            ) : isLoggedIn ? (
                <div className={styles.authPrompt}>
                    <p>Tu cuenta está suspendida y no puedes enviar preguntas.</p>
                    <Link href="/dashboard/pqrs/nueva" className={styles.btnOutline}>
                        Apelar suspensión (PQRS)
                    </Link>
                </div>
            ) : (
                <div className={styles.authPrompt}>
                    <p>Inicia sesión para hacer una pregunta.</p>
                    <div className={styles.authButtons}>
                        <Link href="/login" className={styles.btnOutline}>
                            Iniciar Sesión
                        </Link>
                        <Link href="/registro" className={styles.btnPrimary}>
                            Registrarse
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
