'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { crearPropiedad } from '@/app/acciones/crearPropiedadActions';
import { uploadImageToCloudinary } from '@/app/acciones/uploadActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './PropertyForm.module.css';

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

interface PropertyFormProps {
    serviciosDisponibles: Servicio[];
}

export default function PropertyForm({ serviciosDisponibles }: PropertyFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [titulo, setTitulo] = useState('');
    const [precio, setPrecio] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [ubicacionTexto, setUbicacionTexto] = useState('');
    const [viviendaCompartida, setViviendaCompartida] = useState(false);
    const [perfilArriendo, setPerfilArriendo] = useState('ambos'); // ambos, hombre, mujer
    const [latitud, setLatitud] = useState(7.0687);
    const [longitud, setLongitud] = useState(-73.8427);
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState<number[]>([]);
    
    // Photos state
    const [fotos, setFotos] = useState<File[]>([]);
    const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleServiceToggle = (id: number) => {
        setServiciosSeleccionados(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            
            // Validar tamaño máximo 5MB
            const maxSize = 5 * 1024 * 1024;
            const validFiles = newFiles.filter(file => {
                if (file.size > maxSize) {
                    alert(`La imagen "${file.name}" supera el límite de 5MB y no se añadirá.`);
                    return false;
                }
                return true;
            });

            // Limit to 5 max total
            if (fotos.length + validFiles.length > 5) {
                alert('Solo puedes subir hasta 5 fotos en total.');
                const remainingSlots = 5 - fotos.length;
                if (remainingSlots > 0) {
                    setFotos(prev => [...prev, ...validFiles.slice(0, remainingSlots)]);
                }
                return;
            }
            setFotos(prev => [...prev, ...validFiles]);
        }
    };

    const removePhoto = (index: number) => {
        setFotos(prev => prev.filter((_, i) => i !== index));
        if (mainPhotoIndex === index) {
            setMainPhotoIndex(0);
        } else if (mainPhotoIndex > index) {
            setMainPhotoIndex(mainPhotoIndex - 1);
        }
    };

    const buscarEnMapa = async () => {
        if (!ubicacionTexto.trim()) return;
        try {
            // Añadimos Barrancabermeja para enfocar la búsqueda
            const query = encodeURIComponent(`${ubicacionTexto}, Barrancabermeja, Santander, Colombia`);
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                setLatitud(parseFloat(data[0].lat));
                setLongitud(parseFloat(data[0].lon));
            } else {
                alert('No se encontró la dirección en el mapa. Intenta ser más específico o mueve el marcador manualmente.');
            }
        } catch (e) {
            console.error('Error buscando dirección', e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (fotos.length === 0) {
                throw new Error("Debes subir al menos una foto (Portada).");
            }
            if (fotos.length > 5) {
                throw new Error("El máximo de fotos permitidas es 5.");
            }

            // 1. Upload photos to Cloudinary
            const uploadedUrls: string[] = [];
            
            // Reordenar fotos para que la portada quede de primera
            const orderedFotos = [...fotos];
            const mainPhoto = orderedFotos.splice(mainPhotoIndex, 1)[0];
            orderedFotos.unshift(mainPhoto);

            for (const file of orderedFotos) {
                const imgData = new FormData();
                imgData.append('file', file);
                const res = await uploadImageToCloudinary(imgData);
                if (!res.success) {
                    throw new Error(`Error subiendo foto: ${res.error}`);
                }
                uploadedUrls.push(res.url!);
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
                fotos: uploadedUrls // The ordered URLs
            };

            const result = await crearPropiedad(formData);

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
                            placeholder="Ej. Barrio El Parnaso, Cra 24 #12-34"
                            value={ubicacionTexto}
                            onChange={(e) => setUbicacionTexto(e.target.value)}
                            className={styles.input}
                            style={{ flex: 1 }}
                        />
                        <button type="button" onClick={buscarEnMapa} className={styles.searchMapBtn} title="Buscar en el mapa">
                            <DynamicIcon name="Search" size={20} />
                        </button>
                    </div>
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
                    <h2 className={styles.sectionTitle}>4. Fotos ({fotos.length}/5)</h2>
                    <button 
                        type="button" 
                        className={styles.uploadBtn}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={fotos.length >= 5}
                    >
                        <DynamicIcon name="Upload" size={18} />
                        Subir Fotos
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

                {fotos.length > 0 && (
                    <div className={styles.photosGrid}>
                        {fotos.map((foto, index) => (
                            <div key={index} className={`${styles.photoCard} ${mainPhotoIndex === index ? styles.mainPhotoCard : ''}`}>
                                <img src={URL.createObjectURL(foto)} alt={`Preview ${index}`} className={styles.photoPreview} />
                                
                                <button type="button" className={styles.removePhotoBtn} onClick={() => removePhoto(index)}>
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
                            Publicando...
                        </>
                    ) : (
                        <>Publicar Propiedad</>
                    )}
                </button>
            </div>
        </form>
    );
}
