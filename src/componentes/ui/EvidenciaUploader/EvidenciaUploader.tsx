'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import { checkNsfw, isAllowedMime } from '@/lib/fotos/nsfw';

const MAX_BYTES = 5 * 1024 * 1024;

interface EvidenciaUploaderProps {
    archivos: File[];
    onChange: (archivos: File[]) => void;
    disabled?: boolean;
    max?: number;
}

export default function EvidenciaUploader({
    archivos,
    onChange,
    disabled = false,
    max = 3,
}: EvidenciaUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [validando, setValidando] = useState(false);

    const agregar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const seleccionados = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (seleccionados.length === 0) return;

        const disponibles = max - archivos.length;
        if (disponibles <= 0) {
            toast.error(`Máximo ${max} fotos de evidencia.`);
            return;
        }
        if (seleccionados.length > disponibles) {
            toast.error(`Solo puedes adjuntar ${max} fotos de evidencia.`);
        }

        setValidando(true);
        const seguros: File[] = [];

        for (const file of seleccionados.slice(0, disponibles)) {
            if (file.size > MAX_BYTES) {
                toast.error(`"${file.name}" supera los 5MB.`);
                continue;
            }
            if (!isAllowedMime(file.type)) {
                toast.error(`"${file.name}" tiene un formato no permitido.`);
                continue;
            }
            try {
                const resultado = await checkNsfw(file);
                if (resultado.blocked) {
                    toast.error(
                        `"${file.name}" rechazada: contenido no permitido (${resultado.label} ${(resultado.score * 100).toFixed(0)}%).`
                    );
                    continue;
                }
                seguros.push(file);
            } catch {
                toast.error(`No se pudo validar "${file.name}", se omitirá.`);
            }
        }

        setValidando(false);
        if (seguros.length > 0) {
            onChange([...archivos, ...seguros]);
        }
    };

    const quitar = (index: number) => {
        onChange(archivos.filter((_, position) => position !== index));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    disabled={disabled || validando || archivos.length >= max}
                    onChange={(event) => void agregar(event)}
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || validando || archivos.length >= max}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '0.5rem 0.75rem',
                        background: 'white',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        cursor: disabled || validando ? 'not-allowed' : 'pointer',
                    }}
                >
                    <DynamicIcon name="Upload" size={15} />
                    {validando ? 'Validando...' : 'Adjuntar evidencia'}
                </button>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {archivos.length}/{max} · máx. 5MB cada una
                </span>
            </div>

            {archivos.length > 0 && (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {archivos.map((archivo, index) => (
                        <li
                            key={`${archivo.name}-${archivo.size}-${index}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: '0.78rem',
                                color: '#334155',
                                background: '#f8fafc',
                                border: '1px solid var(--color-border)',
                                borderRadius: 6,
                                padding: '3px 8px',
                            }}
                        >
                            <DynamicIcon name="Image" size={13} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {archivo.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => quitar(index)}
                                disabled={disabled}
                                aria-label={`Quitar ${archivo.name}`}
                                style={{ marginLeft: 'auto', border: 0, background: 'transparent', cursor: 'pointer', color: '#b91c1c' }}
                            >
                                <DynamicIcon name="X" size={13} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
