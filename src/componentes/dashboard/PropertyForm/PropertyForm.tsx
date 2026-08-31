'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { crearPropiedad, editarPropiedad } from '@/app/acciones/crearPropiedadActions';
import { uploadImageToCloudinary } from '@/app/acciones/uploadActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import toast from 'react-hot-toast';
import styles from './PropertyForm.module.css';
import { checkNsfw, isAllowedMime } from '@/lib/fotos/nsfw';

// Importación dinámica del mapa para evitar errores de SSR con Leaflet
const MapComponent = dynamic(() => import('./MapComponent'), { 
    ssr: false, 
    loading: () => <div className={styles.mapSkeleton}>Cargando mapa...</div>
});

interface Servicio {
    id: number;
    nombre: string;
    icono: string;
}

interface PhotoItem {
    id: string;
    url: string;
    file?: File;
    isExisting: boolean;
}

interface PropertyFormProps {
    serviciosDisponibles: Servicio[];
    initialData?: any;
    isEditing?: boolean;
    propiedadId?: number;
}

export default function PropertyForm({ 
    serviciosDisponibles, 
    initialData, 
    isEditing = false,
    propiedadId
}: PropertyFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states (pre-populated in editing mode)
    const [titulo, setTitulo] = useState(initialData?.titulo || '');
    const [precio, setPrecio] = useState(initialData?.precio?.toString() || '');
    const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
    const [ubicacionTexto, setUbicacionTexto] = useState(initialData?.ubicacion_texto || '');
    const [viviendaCompartida, setViviendaCompartida] = useState(initialData?.vivienda_compartida || false);
    const [perfilArriendo, setPerfilArriendo] = useState(initialData?.perfil_arriendo || 'ambos');
    const [latitud, setLatitud] = useState(initialData?.ubicacion_lat || 7.0687);
    const [longitud, setLongitud] = useState(initialData?.ubicacion_lng || -73.8427);
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState<number[]>(() => {
        if (initialData?.propiedades_servicios) {
            return initialData.propiedades_servicios.map((s: any) => s.servicio_id);
        }
        return [];
    });
    
    // Photos state - Unified for existing and new photos
    const [photos, setPhotos] = useState<PhotoItem[]>(() => {
        if (initialData?.propiedades_fotos) {
            // Sort by order ascending
            const sorted = [...initialData.propiedades_fotos].sort((a: any, b: any) => a.orden - b.orden);
            return sorted.map((foto: any, idx: number) => ({
                id: `existing-${idx}-${foto.url}`,
                url: foto.url,
                isExisting: true
            }));
        }
        return [];
    });

    const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
    const [ubicacionError, setUbicacionError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleServiceToggle = (id: number) => {
        setServiciosSeleccionados(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const [validatingNsfw, setValidatingNsfw] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        const maxSize = 5 * 1024 * 1024;
        let validFiles: File[] = [];
        for (const file of newFiles) {
            if (file.size > maxSize) { toast.error(`"${file.name}" supera 5MB`); continue; }
            if (!isAllowedMime(file.type)) { toast.error(`"${file.name}" formato no permitido`); continue; }
            validFiles.push(file);
        }
        if (photos.length + validFiles.length > 5) {
            toast.error('Solo 5 fotos en total.');
            validFiles = validFiles.slice(0, 5 - photos.length);
        }
        if (validFiles.length === 0) return;
        setValidatingNsfw(true);
        const safeFiles: File[] = [];
        for (const file of validFiles) {
            try {
                const res = await checkNsfw(file);
                if (res.blocked) {
                    toast.error(`"${file.name}" rechazada: contenido no permitido (${res.label} ${(res.score*100).toFixed(0)}%)`);
                    continue;
                }
                if (res.predictions.find(p => p.className === 'Sexy' && p.probability > 0.7)) {
                    toast(`"${file.name}" marcada para revisión manual`, { icon: '⚠️' });
                }
                safeFiles.push(file);
            } catch {
                toast.error(`No se pudo validar "${file.name}", se omitirá`);
            }
        }
        setValidatingNsfw(false);
        if (safeFiles.length === 0) return;
        const newItems: PhotoItem[] = safeFiles.map((file, idx) => ({
            id: `new-${Date.now()}-${idx}-${Math.random()}`,
            url: URL.createObjectURL(file),
            file,
            isExisting: false
        }));
        setPhotos(prev => [...prev, ...newItems]);
    };

    const removePhoto = (id: string) => {
        const index = photos.findIndex(p => p.id === id);
        if (index === -1) return;

        setPhotos(prev => prev.filter(p => p.id !== id));
        if (mainPhotoIndex === index) {
            setMainPhotoIndex(0);
        } else if (mainPhotoIndex > index) {
            setMainPhotoIndex(mainPhotoIndex - 1);
        }
    };

    const buscarEnMapa = async () => {
        if (!ubicacionTexto.trim()) {
            setUbicacionError('Ingresa una dirección para buscar.');
            return;
        }
        
        try {
            setUbicacionError(null);
            const raw = ubicacionTexto.trim();
            const variants = [
                `${raw}, Barrancabermeja, Santander, Colombia`,
                raw.replace(/\s+con\s+/i, ' con ').replace('#', ' ').trim() + ', Barrancabermeja, Colombia',
                raw.replace(/calle\s*/i, 'Calle ').replace(/carrera\s*/i, 'Carrera ').trim() + ', Barrancabermeja',
                raw
            ];
            let found: any = null;
            for (const query of variants) {
                const params = new URLSearchParams({ format: 'json', q: query, limit: '1', countrycodes: 'co', addressdetails: '1' });
                const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
                const respuesta = await fetch(url);
                if (!respuesta.ok) continue;
                const datos = await respuesta.json();
                if (datos?.length) { found = datos[0]; break; }
            }
            if (found) {
                setLatitud(parseFloat(found.lat));
                setLongitud(parseFloat(found.lon));
                setUbicacionError(null);
            } else {
                const fallback = raw.replace(/\s*con\s*/i, ' y ').replace('#', ' ').split(',')[0];
                const p2 = new URLSearchParams({ format: 'json', q: `${fallback}, Barrancabermeja, Colombia`, limit: '1', countrycodes: 'co' });
                const r2 = await fetch(`https://nominatim.openstreetmap.org/search?${p2.toString()}`);
                const d2 = await r2.json();
                if (d2?.length) { setLatitud(parseFloat(d2[0].lat)); setLongitud(parseFloat(d2[0].lon)); setUbicacionError(null); }
                else setUbicacionError('No se encontró la dirección. Intenta ser más específico o mueve el marcador manualmente.');
            }
        } catch (e) {
            console.error('Error buscando dirección:', e);
            setUbicacionError('Error al buscar la dirección. Intenta nuevamente o mueve el marcador manualmente.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (photos.length === 0) {
                throw new Error("Debes subir al menos una foto (Portada).");
            }
            if (photos.length > 5) {
                throw new Error("El máximo de fotos permitidas es 5.");
            }

            // 1. Prepare photo URLs (uploading new ones to Cloudinary)
            const finalPhotoUrls: string[] = [];
            
            // Reordenar fotos para que la portada quede de primera
            const orderedPhotos = [...photos];
            // Asegurar que mainPhotoIndex esté dentro de los límites válidos
            const coverIndex = mainPhotoIndex < orderedPhotos.length ? mainPhotoIndex : 0;
            const mainPhoto = orderedPhotos.splice(coverIndex, 1)[0];
            orderedPhotos.unshift(mainPhoto);

            for (const photo of orderedPhotos) {
                if (photo.isExisting) {
                    finalPhotoUrls.push(photo.url);
                } else if (photo.file) {
                    const imgData = new FormData();
                    imgData.append('file', photo.file);
                    const res = await uploadImageToCloudinary(imgData);
                    if (!res.success) {
                        throw new Error(`Error subiendo foto: ${res.error}`);
                    }
                    finalPhotoUrls.push(res.url!);
                }
            }

            // 2. Submit form data to our DB action
            const formData = {
                titulo,
                precio: parseFloat(precio.replace(/\./g, '').replace(/,/g, '')), // Basic cleanup if they paste formatted string
                descripcion,
                ubicacion_texto: ubicacionTexto,
                vivienda_compartida: viviendaCompartida,
                perfil_arriendo: perfilArriendo,
                latitud,
                longitud,
                servicios: serviciosSeleccionados,
                fotos: finalPhotoUrls // The ordered URLs
            };

            const result = isEditing && propiedadId
                ? await editarPropiedad(propiedadId, formData)
                : await crearPropiedad(formData);

            if (result.success) {
                router.push('/dashboard/propiedades');
            } else {
                setError(result.error || 'Error al guardar la propiedad.');
            }
        } catch (err: any) {
            setError(err.message || 'Error inesperado');
        } finally {
            setIsSubmitting(false);
        }
    };

function MejorarDescripcion({ titulo, precio, ubicacion_texto, servicios, descripcion, propiedadId, onAplicar }: any) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [usos, setUsos] = useState(0);
    const key = `ia_mejorar_${propiedadId || 'nuevo'}`;
    useEffect(() => { setUsos(Number(localStorage.getItem(key) || 0)); }, [key]);
    const handle = async () => {
        if (descripcion.trim().length < 20) { toast.error('Escribe al menos 20 caracteres antes de mejorar'); return; }
        if (usos >= 2) { toast.error('Límite 2 mejoras por propiedad'); return; }
        setLoading(true);
        const r = await fetch('/api/ai/mejorar-descripcion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ descripcion, titulo, precio, ubicacion_texto, servicios }) });
        const j = await r.json();
        setLoading(false);
        if (!r.ok) { toast.error(j.error || 'Error IA'); return; }
        setPreview(j.mejorada);
        toast('Revisa la sugerencia y decide si aplicarla', { icon: '✨' });
    };
    if (preview) {
        return (
            <div style={{ marginTop: '0.6rem', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>✨ Sugerencia IA (no se aplica automático):</p>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', background: 'white', padding: '0.6rem', borderRadius: 6, border: '1px solid #e2e8f0' }}>{preview}</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>Aviso: el texto es sugerencia; tú eres responsable del contenido publicado.</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                    <button type="button" onClick={() => { onAplicar(preview); const n = usos + 1; localStorage.setItem(key, String(n)); setUsos(n); setPreview(null); toast.success('Descripción mejorada aplicada'); }} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600 }}>Aplicar</button>
                    <button type="button" onClick={() => setPreview(null)} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid var(--color-border)', borderRadius: 8 }}>Descartar</button>
                </div>
            </div>
        );
    }
    return (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button type="button" onClick={handle} disabled={loading || usos >= 2} style={{ padding: '0.5rem 0.8rem', background: usos >= 2 ? '#94a3b8' : 'white', border: '1px solid var(--color-border)', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', color: usos >= 2 ? 'white' : '#1f2937' }}>{loading ? 'Mejorando...' : `✨ Mejorar con IA (${2 - usos} restantes)`}</button>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Escribe detalles primero. Límite 2 por propiedad.</span>
        </div>
    );
}

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorAlert}>{error}</div>}

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Información Básica</h2>
                
                <div className={styles.formGroup}>
                    <label>Título de la publicación *</label>
                    <input 
                        type="text" 
                        required 
                        maxLength={100}
                        placeholder="Ej. Habitación amplia cerca de la portería"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Precio Mensual (COP) *</label>
                        <div className={styles.priceInputWrapper}>
                            <span className={styles.priceSymbol}>$</span>
                            <input 
                                type="number" 
                                required 
                                min={10000}
                                placeholder="Ej. 450000"
                                value={precio}
                                onChange={(e) => setPrecio(e.target.value)}
                                className={styles.inputWithSymbol}
                            />
                        </div>
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label>Tipo de Vivienda</label>
                        <div className={styles.checkboxGroup}>
                            <input 
                                type="checkbox" 
                                id="compartida"
                                checked={viviendaCompartida}
                                onChange={(e) => setViviendaCompartida(e.target.checked)}
                            />
                            <label htmlFor="compartida" className={styles.checkboxLabel}>Es una vivienda compartida</label>
                        </div>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Perfil Preferido de Arrendatario</label>
                    <select 
                        value={perfilArriendo} 
                        onChange={(e) => setPerfilArriendo(e.target.value)}
                        className={styles.select}
                    >
                        <option value="ambos">Ambos (Estudiantes y Externos)</option>
                        <option value="solo estudiante">Solo Estudiante</option>
                        <option value="solo externo">Solo Externo</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Descripción *</label>
                    <textarea 
                        required 
                        rows={5}
                        placeholder="Describe el espacio, reglas de convivencia, transporte cercano, etc."
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        className={styles.textarea}
                    />
                    <MejorarDescripcion titulo={titulo} precio={precio} ubicacion_texto={ubicacionTexto} servicios={serviciosSeleccionados.map(id => serviciosDisponibles.find(s=>s.id===id)?.nombre).filter(Boolean) as string[]} descripcion={descripcion} propiedadId={propiedadId} onAplicar={setDescripcion} />
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Servicios Incluidos</h2>
                <div className={styles.servicesGrid}>
                    {serviciosDisponibles.map(servicio => (
                        <div 
                            key={servicio.id} 
                            className={`${styles.serviceCard} ${serviciosSeleccionados.includes(servicio.id) ? styles.serviceCardSelected : ''}`}
                            onClick={() => handleServiceToggle(servicio.id)}
                        >
                            <DynamicIcon name={servicio.icono} size={24} />
                            <span>{servicio.nombre}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>3. Ubicación</h2>
                
                <div className={styles.formGroup}>
                    <label>Dirección Corta o Referencia *</label>
                    <div className={styles.searchAddressGroup}>
                        <input 
                            type="text" 
                            required
                            disabled
                            placeholder="La búsqueda por dirección exacta no esta disponible"
                            value={ubicacionTexto}
                            onChange={(e) => {
                                setUbicacionTexto(e.target.value);
                                setUbicacionError(null);
                            }}
                            className={styles.input}
                            style={{ flex: 1 }}
                        />
                        <button type="button" onClick={buscarEnMapa} className={styles.searchMapBtn} title="Buscar en el mapa" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            <DynamicIcon name="Search" size={20} />
                        </button>
                    </div>
                    {ubicacionError && (
                        <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            {ubicacionError}
                        </div>
                    )}
                </div>

                <div className={styles.mapGroup}>
                    <label>Ubicación en el Mapa</label>
                    <p className={styles.mapHelp}>Arrastra el marcador rojo hasta la ubicación exacta de tu propiedad.</p>
                    <MapComponent 
                        lat={latitud} 
                        lng={longitud} 
                        onLocationChange={(lat, lng, address) => {
                            setLatitud(lat);
                            setLongitud(lng);
                            if (address) {
                                setUbicacionTexto(address);
                            }
                        }} 
                    />
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>4. Fotos ({photos.length}/5)</h2>
                    <button 
                        type="button" 
                        className={styles.uploadBtn}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photos.length >= 5 || validatingNsfw}
                    >
                        <DynamicIcon name="Upload" size={18} />
                        {validatingNsfw ? 'Validando...' : 'Subir Fotos'}
                    </button>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/jpeg, image/png, image/webp" 
                        className={styles.hiddenInput}
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />
                </div>
                <p className={styles.photoHelp}>Sube hasta 5 fotos (Máx 5MB por foto). La primera foto seleccionada será la portada. Haz clic en "Establecer Portada" en cualquier foto para cambiarla.</p>

                {photos.length > 0 && (
                    <div className={styles.photosGrid}>
                        {photos.map((photo, index) => (
                            <div key={photo.id} className={`${styles.photoCard} ${mainPhotoIndex === index ? styles.mainPhotoCard : ''}`}>
                                <img src={photo.url} alt={`Preview ${index}`} className={styles.photoPreview} />
                                
                                <button type="button" className={styles.removePhotoBtn} onClick={() => removePhoto(photo.id)}>
                                    <DynamicIcon name="X" size={16} />
                                </button>

                                {mainPhotoIndex === index ? (
                                    <div className={styles.mainBadge}>Portada</div>
                                ) : (
                                    <button 
                                        type="button" 
                                        className={styles.setMainBtn}
                                        onClick={() => setMainPhotoIndex(index)}
                                    >
                                        Establecer Portada
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <div className={styles.spinner}></div>
                            {isEditing ? 'Guardando...' : 'Publicando...'}
                        </>
                    ) : (
                        <>{isEditing ? 'Guardar Cambios' : 'Publicar Propiedad'}</>
                    )}
                </button>
            </div>
        </form>
    );
}
