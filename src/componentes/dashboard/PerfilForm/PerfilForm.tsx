'use client';
import { useState, useRef } from 'react';
import { actualizarPerfil, enviarCodigoSMS, verificarCodigoSMS } from '@/app/acciones/perfilActions';
import { uploadImageToCloudinary } from '@/app/acciones/uploadActions';
import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './PerfilForm.module.css';

interface PerfilFormProps {
    initialPerfil: any;
    email: string;
}

export default function PerfilForm({ initialPerfil, email }: PerfilFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    
    // Estados del formulario
    const [nombre, setNombre] = useState(initialPerfil?.nombre_completo || '');
    const [telefono, setTelefono] = useState(initialPerfil?.telefono || '');
    const [avatarUrl, setAvatarUrl] = useState(initialPerfil?.avatar_url || '');
    const [isVerified, setIsVerified] = useState(initialPerfil?.telefono_verificado || false);

    // Estados de verificación SMS
    const [isVerifying, setIsVerifying] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadImageToCloudinary(formData);
        
        if (result.success && result.url) {
            setAvatarUrl(result.url);
            setMessage({ text: 'Foto subida. No olvides guardar los cambios.', type: 'success' });
        } else {
            setMessage({ text: result.error || 'Error subiendo la foto', type: 'error' });
        }
        
        setIsSaving(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('nombre_completo', nombre);
        formData.append('telefono', telefono);
        formData.append('avatar_url', avatarUrl);

        const result = await actualizarPerfil(formData);

        if (result.success) {
            setMessage({ text: 'Perfil actualizado correctamente', type: 'success' });
            // Si el teléfono cambió, reseteamos la verificación
            if (telefono !== initialPerfil?.telefono && isVerified) {
                setIsVerified(false);
                setMessage({ text: 'Perfil actualizado. Debes volver a verificar tu nuevo número.', type: 'error' });
            }
        } else {
            setMessage({ text: result.error || 'Error al guardar', type: 'error' });
        }

        setIsSaving(false);
    };

    const handleSendSMS = async () => {
        if (!telefono || telefono.length < 10) {
            setMessage({ text: 'Ingresa un número de teléfono válido (Mínimo 10 dígitos)', type: 'error' });
            return;
        }

        setIsVerifying(true);
        setMessage(null);

        const result = await enviarCodigoSMS(telefono);
        
        if (result.success) {
            setShowOtpInput(true);
            setMessage({ text: result.message || 'Código enviado', type: 'success' });
        } else {
            setMessage({ text: result.error || 'Error enviando SMS', type: 'error' });
        }
        
        setIsVerifying(false);
    };

    const handleVerifyOTP = async () => {
        if (!otpCode) return;

        setIsVerifying(true);
        setMessage(null);

        const result = await verificarCodigoSMS(telefono, otpCode);
        
        if (result.success) {
            setIsVerified(true);
            setShowOtpInput(false);
            setMessage({ text: '¡Teléfono verificado exitosamente!', type: 'success' });
        } else {
            setMessage({ text: result.error || 'Código incorrecto', type: 'error' });
        }
        
        setIsVerifying(false);
    };

    return (
        <form onSubmit={handleSave} className={styles.form}>
            {message && (
                <div className={`${styles.message} ${message.type === 'success' ? styles.successMsg : styles.errorMsg}`}>
                    {message.text}
                </div>
            )}

            <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Perfil" className={styles.avatarImage} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            <DynamicIcon name="Camera" size={32} />
                        </div>
                    )}
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className={styles.uploadBtn}
                        disabled={isSaving}
                    >
                        <DynamicIcon name="Upload" size={16} /> Cambiar Foto
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleAvatarUpload} 
                        accept="image/*" 
                        className={styles.hiddenInput}
                    />
                </div>
                <div className={styles.avatarInfo}>
                    <p>Sube una foto clara de tu rostro.</p>
                    <span>JPG, PNG o WebP. Máximo 5MB.</span>
                </div>
            </div>

            <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                    <label>Nombre Completo</label>
                    <input 
                        type="text" 
                        value={nombre} 
                        onChange={(e) => setNombre(e.target.value)} 
                        required 
                        placeholder="Ej: Juan Pérez"
                        className={styles.input}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Correo Electrónico</label>
                    <input 
                        type="email" 
                        value={email} 
                        disabled 
                        className={styles.inputDisabled}
                        title="El correo no se puede cambiar"
                    />
                </div>

                <div className={styles.phoneSection}>
                    <div className={styles.inputGroup}>
                        <label>Teléfono (Celular)</label>
                        <div className={styles.phoneInputWrapper}>
                            <input 
                                type="tel" 
                                value={telefono} 
                                onChange={(e) => setTelefono(e.target.value)} 
                                placeholder="Ej: 3001234567"
                                className={styles.input}
                                disabled={isVerified && telefono === initialPerfil?.telefono}
                            />
                            {isVerified && telefono === initialPerfil?.telefono ? (
                                <span className={styles.verifiedBadge}>
                                    <DynamicIcon name="CheckCircle2" size={16} /> Verificado
                                </span>
                            ) : (
                                <button 
                                    type="button" 
                                    onClick={handleSendSMS}
                                    className={styles.verifyBtn}
                                    disabled={isVerifying || !telefono}
                                >
                                    Verificar SMS
                                </button>
                            )}
                        </div>
                    </div>

                    {showOtpInput && !isVerified && (
                        <div className={styles.otpBox}>
                            <p>Ingresa el código de 6 dígitos que enviamos a tu celular.</p>
                            <div className={styles.otpInputWrapper}>
                                <input 
                                    type="text" 
                                    value={otpCode} 
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    placeholder="123456"
                                    maxLength={6}
                                    className={styles.otpInput}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleVerifyOTP}
                                    className={styles.confirmVerifyBtn}
                                    disabled={isVerifying || otpCode.length < 6}
                                >
                                    {isVerifying ? 'Verificando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.actions}>
                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    );
}
